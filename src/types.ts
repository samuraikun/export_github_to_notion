export type Issue = {
  id: string;
  number: number;
  title: string;
  createdAt: string;
  author: {
    login: string;
  }
  body: string;
  comments: {
    nodes: Comment[];
  };
}

type Comment = {
  author: {
    login: string;
  };
  body: string;
}

export type IssueResponse = {
  repository: {
    issue: Issue;
  }
}

export type IssuesResponse = {
  repository: {
    issues: {
      nodes: Issue[];
    };
  }
}
