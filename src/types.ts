export interface ChangelogItem {
    hash: string,
    title: string,
    timestamp: number,
    category: string
    group: Group;
}

export interface Group {
    order: number;
    header: string;
}

export interface GroupedItems {
    group: Group;
    items: ChangelogItem[];
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
