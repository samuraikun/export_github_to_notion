import { getIssues, exportIssuesToNotion } from "./export";

async function run() {
  // export all issues
  const issues = await getIssues();
  await exportIssuesToNotion(issues);

  // export one issue
  // const issue = await getIssue("crevo-inc", "crevo-setup", 255);
  // await exportIssueToNotion(issue);
}

run().catch(console.error);
