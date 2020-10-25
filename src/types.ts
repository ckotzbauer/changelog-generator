
export interface Commit {
    parents: string[],
    hash: string,
    tree: string,
    author: {
        name: string,
        email: string,
        timestamp: number,
        timezone: string
    },
    committer: {
        name: string,
        email: string,
        timestamp: number,
        timezone: string
    },
    title: string,
    description: string
}

export interface ChangelogItem {
    hash: string,
    title: string,
    timestamp: number,
    category: string
}

export interface Options {
    template: string;
    ascending: boolean;
    releaseDate: string;
    releaseVersion: string;
    file: string;
    commitOutput: string;
    repository: string;
    notableChanges: boolean;
    githubHandle: string;
}
