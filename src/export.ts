require('dotenv').config();

import { graphql } from "@octokit/graphql";
import { Client } from "@notionhq/client";
import { BlockObjectRequest } from "@notionhq/client/build/src/api-endpoints";
import { Issue, IssueResponse, IssuesResponse } from "./types";
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
        url: `https://github.com/crevo-inc/crevo-setup/issues/${issue.number}`,
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
