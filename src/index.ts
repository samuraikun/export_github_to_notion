require('dotenv').config();
import {
  getIssue,
  getPullRequestDiff,
  getPullRequest,
  getPullRequests,
  exportIssueToNotion,
  exportPullRequestToNotion,
  exportPullRequestsToNotion
} from "./export";

async function run() {
  // export all issues
  // const issues = await getIssues();
  // await exportIssuesToNotion(issues);

  // export one issue
  // const issue_number = parseInt(process.argv[2]);
  // const issue = await getIssue(process.env.OWNER!, process.env.REPO!, issue_number);
  // await exportIssueToNotion(issue);

  // export one pull request
  const pull_number = parseInt(process.argv[2]);
  const pullRequest = await getPullRequest(process.env.OWNER!, process.env.REPO!, pull_number);
  await exportPullRequestToNotion(pullRequest);

  // export all pull requests
  // const pullRequests = await getPullRequests(process.env.OWNER!, process.env.REPO!);
  // await exportPullRequestsToNotion(pullRequests);

  // fetch only pull-request diff
  // const pull_number = parseInt(process.argv[2]);
  // const diff = await getPullRequestDiff(pull_number);
  // console.log(diff);

}

run().catch(console.error);
