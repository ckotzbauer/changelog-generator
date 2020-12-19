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
