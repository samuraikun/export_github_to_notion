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

type Review = {
  author: {
    login: string;
  };
  body: string;
  comments: {
    nodes: Comment[];
  }
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

export type PullRequest = {
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
  reviews: {
    nodes: Review[];
  }
}

export type PullRequestResponse = {
  repository: {
    pullRequest: PullRequest;
  };
}

export type PullRequestsResponse = {
  repository: {
    pullRequests: {
      nodes: PullRequest[];
      pageInfo: {
        endCursor: string;
        hasNextPage: boolean;
      };
    }
  };
}
