import { graphql } from "@octokit/graphql";
import { Octokit } from "@octokit/rest";
import { Client, APIResponseError } from "@notionhq/client";
import { BlockObjectRequest } from "@notionhq/client/build/src/api-endpoints";
import { Issue, IssueResponse, IssuesResponse, PullRequest, PullRequestResponse, PullRequestsResponse } from "./types";
import { markdownToBlocks } from '@tryfabric/martian';

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const graphqlWithAuth = graphql.defaults({
  headers: {
    authorization: `token ${process.env.GITHUB_TOKEN}`,
  }
});

export async function getIssue(owner: string, repo: string, issue_number: number): Promise<Issue> {
  const query = `
    query($owner: String!, $repo: String!, $issue_number: Int!) {
      repository(owner: $owner, name: $repo) {
        issue(number: $issue_number) {
          id
          number
          title
          createdAt
          author {
            login
          }
          body
          comments(first: 50) {
            nodes {
              author {
                login
              }
              body
            }
          }
        }
      }
    }
  `;

  const variables = { owner, repo, issue_number };
  const response = await graphqlWithAuth(query, variables) as IssueResponse;

  return response.repository.issue;
}

export async function exportIssueToNotion(issue: Issue): Promise<void> {
  const mds = [issue.body, ...issue.comments.nodes.map(comment => comment.body)]
  const options = {
    notionLimits: {
      truncate: true,
      onError: (err: Error) => {
        console.error(err);
      },
    },
  }
  const blocks = mds.flatMap(md => markdownToBlocks(md, options));

  await notion.pages.create({
    parent: { type: "database_id", database_id: process.env.NOTION_DATABASE_ID! },
    properties: {
      "title": {
        title: [
          {
            "text": {
              "content": issue.title,
            },
          },
        ],
      },
      "author": {
        rich_text: [
          {
            text: {
              content: issue.author.login,
            },
          },
        ],
      },
      "createdAt": {
        date: {
          start: issue.createdAt,
        },
      },
      "githubUrl": {
        url: `https://github.com/${process.env.OWNER}/${process.env.REPO}/issues/${issue.number}`,
      }
    },
    children: blocks as BlockObjectRequest[],
  });
}

export async function getIssues(): Promise<Issue[]> {
  const query = `
    query ($owner: String!, $repo: String!) {
      repository(owner: $owner, name: $repo) {
        issues(last: 100, orderBy: { field: CREATED_AT, direction: ASC }) {
          nodes {
            id
            number
            title
            createdAt
            author {
              login
            }
            body
            comments(first: 50) {
              nodes {
                author {
                  login
                }
                body
              }
            }
          }
        }
      }
    }
  `;

  const variables = { owner: "crevo-inc", repo: "crevo-setup" };
  const response = await graphqlWithAuth(query, variables) as IssuesResponse;

  return response.repository.issues.nodes;
}

export async function exportIssuesToNotion(issues: Issue[]): Promise<void> {
  for (const issue of issues) {
    await exportIssueToNotion(issue);
  }
}

export async function getPullRequest(owner: string, repo: string, pull_number: number): Promise<PullRequest> {
  const query = `
    query ($owner: String!, $repo: String!, $pull_number: Int!) {
      repository(owner: $owner, name: $repo) {
        pullRequest(number: $pull_number) {
          id
          number
          title
          createdAt
          author {
            login
          }
          body
          comments(first: 50) {
            nodes {
              author {
                login
              }
              body
            }
          }
          reviews(first: 30) {
            nodes {
              author {
                login
              }
              body
              comments(first: 30) {
                nodes {
                  author {
                    login
                  }
                  body
                }
              }
            }
          }
        }
      }
    }
  `;

  const variables = { owner, repo, pull_number };
  const response = await graphqlWithAuth(query, variables) as PullRequestResponse;

  return response.repository.pullRequest;
}

export async function getPullRequests(owner: string, repo: string, after: string | null = null): Promise<PullRequest[]> {
  const query = `
    query ($owner: String!, $repo: String!, $after: String) {
      repository(owner: $owner, name: $repo) {
        pullRequests(first: 100, after: $after, orderBy: { field: CREATED_AT, direction: DESC }) {
          nodes {
            id
            number
            title
            createdAt
            author {
              login
            }
            body
            comments(first: 50) {
              nodes {
                author {
                  login
                }
                body
              }
            }
            reviews(first: 30) {
              nodes {
                author {
                  login
                }
                body
                comments(first: 30) {
                  nodes {
                    author {
                      login
                    }
                    body
                  }
                }
              }
            }
          }
          pageInfo {
            endCursor
            hasNextPage
          }
        }
      }
    }
  `;

  const variables = { owner, repo, after };
  const response = await graphqlWithAuth(query, variables) as PullRequestsResponse;
  const pullRequests = response.repository.pullRequests.nodes;
  const { endCursor, hasNextPage } = response.repository.pullRequests.pageInfo;

  if (hasNextPage) {
    return pullRequests.concat(await getPullRequests(owner, repo, endCursor));
  } else {
    return pullRequests;
  }
}

export async function getPullRequestDiff(pull_number: number) {
  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  const { data: diff } = await octokit.pulls.get({
    owner: process.env.OWNER!,
    repo: process.env.REPO!,
    pull_number: pull_number,
    mediaType: {
      format: 'diff',
    },
  }) as any; // string

  const diffBody = `
\`\`\`diff
${diff}
\`\`\`
  `
  return diffBody;
}

export async function exportPullRequestToNotion(pullRequest: PullRequest): Promise<void> {
  const comments = pullRequest.comments.nodes.map(comment => comment.body);
  const reviews = pullRequest.reviews.nodes.flatMap(review => [review.body, ...review.comments.nodes.map(comment => comment.body)]);
  const mds = [pullRequest.body, "## Comments", ...comments, ...reviews].filter(md => md !== null) as string[];
  const options = {
    notionLimits: {
      truncate: true,
      onError: (err: Error) => {
        console.error(err);
      },
    },
  }
  const blocks = mds.flatMap(md => markdownToBlocks(md, options));
  const diff = await getPullRequestDiff(pullRequest.number);
  const diffHeading = {
    "object": "block",
    "type": "heading_2",
    "heading_2": {
      "rich_text": [
        {
          "type": "text",
          "text": {
            "content": "File Changes",
          },
        },
      ],
    },
  }
  const diffBlocks = markdownToBlocks(diff, options);
  const children = [...blocks, diffHeading, ...diffBlocks];

  try {
    await notion.pages.create({
      parent: { type: "database_id", database_id: process.env.NOTION_DATABASE_ID! },
      properties: {
        "title": {
          title: [
            {
              "text": {
                "content": pullRequest.title,
              },
            },
          ],
        },
        "author": {
          rich_text: [
            {
              text: {
                content: pullRequest.author.login,
              },
            },
          ],
        },
        "createdAt": {
          date: {
            start: pullRequest.createdAt,
          },
        },
        "githubUrl": {
          url: `https://github.com/${process.env.OWNER}/${process.env.REPO}/issues/${pullRequest.number}`,
        }
      },
      children: children as BlockObjectRequest[],
    });
  } catch (error) {
    if (error instanceof APIResponseError) {
      console.error({ code: error.code, status: error.status, body: error.body });
    } else {
      console.error(error);
    }
  }
}

export async function exportPullRequestsToNotion(pullRequests: PullRequest[]): Promise<void> {
  for (const pullRequest of pullRequests) {
    await exportPullRequestToNotion(pullRequest);
  }
}
