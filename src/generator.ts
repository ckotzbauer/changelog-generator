import { resolve } from 'path';
import { readFile, writeFile } from 'fs/promises';
import prependFile from 'prepend-file';
import simpleGit, { SimpleGit } from 'simple-git';
import { ChangelogItem, GroupedItems, Options } from './types';
import Mustache from 'mustache';

const group = (arr: ChangelogItem[]): GroupedItems[] => {
    return arr.reduce((rv: GroupedItems[], item: ChangelogItem) => {
        const groupIndex = rv.findIndex(x => x.group.order == item.group.order);
        
        if (groupIndex !== -1) {
            rv[groupIndex].items.push(item);
        } else {
            rv.push({ items: [item], group: item.group });
        }

        return rv;
    }, []);
};

export const getCategoryHeadline: (category: string) => { order: number, header: string } = (category: string): { order: number, header: string } => {
    switch (category) {
        case "feat":
        case "feature":
        case "perf":
            return { order: 1, header: "Features and improvements" };
        case "fix":
            return { order: 2, header: "Bug fixes" };
        case "clean":
        case "cleanup":
        case "refactor":
            return { order: 3, header: "Cleanup and refactoring" };
        case "build":
        case "test":
        case "tests":
            return { order: 4, header: "Build and testing" };
        case "doc":
        case "docs":
            return { order: 5, header: "Documentation" };
        case "security":
            return { order: 6, header: "Security" };
        case "deps":
            return { order: 7, header: "Dependency updates" };
        default:
            return { order: 99, header: "Common changes" };
    }
};

export const reformatCommit: (m: string) => { title: string, category: string } = (message: string): { title: string, category: string } => {
    let index = message.indexOf(':');
    let category = 'chore';
    let title = '';

    if (index === message.indexOf(':)') || index === message.indexOf(':(')) {
        index = -1;
    }

    if (index > 0) {
        category = message.substr(0, index).trim();
        title = message.substr(index + 1).trim();
    } else {
        title = message.trim();
    }

    const startIndex = category.indexOf("(");
    const endIndex = category.indexOf(")");

    if (startIndex !== -1 && endIndex !== -1) {
        category = category.substring(startIndex + 1, endIndex);
    }

    return { title, category: category.toLowerCase() };
}

const fetchChangelogItems: (git: SimpleGit, from: string, asc: boolean) => Promise<GroupedItems[]> = async function (git: SimpleGit, from: string, asc: boolean): Promise<GroupedItems[]> {
    const commits = await git.log({ to: "HEAD", from });
    const items = commits.all
        .map(commit => {
            if (commit.message.indexOf('Merge branch') === -1 && commit.message.indexOf('Merge remote-tracking branch') === -1) {
                const { title, category } = reformatCommit(commit.message);
                return {
                    hash: commit.hash.substr(0, 8),
                    title,
                    category,
                    group: getCategoryHeadline(category),
                    timestamp: new Date(commit.date).getMilliseconds()
                };
            }

            return null;
        })
        .filter(x => x)
        .sort((a: ChangelogItem, b: ChangelogItem): number => {
            if (a.category !== b.category) {
                return a.category.localeCompare(b.category);
            }

            if (asc) {
                return a.timestamp - b.timestamp;
            } else {
                return b.timestamp - a.timestamp;
            }
        });
    return group(items).sort((a: GroupedItems, b: GroupedItems) => a.group.order - b.group.order);
};

export const generate: (o: Options) => Promise<void> = async function (o: Options): Promise<void> {
    try {
        const git = simpleGit(o.repository);

        const tags = await git.tags();
        const t = tags.all;
        const from = t.length === 0 ? null : t[t.length - 1];
        let groups: GroupedItems[] = await fetchChangelogItems(git, from, o.ascending);

        const template = await readFile(resolve(__dirname, '..', `${o.template}.mustache`), 'utf8');
        const placeholder = {
            groups,
            version: o.releaseVersion,
            date: o.releaseDate,
            notableChanges: o.notableChanges,
            githubHandle: o.githubHandle
        };

        await prependFile(resolve(o.repository, o.file), Mustache.render(template, placeholder));

        if (o.commitOutput) {
            placeholder.version = null;
            await writeFile(resolve(o.repository, o.commitOutput), Mustache.render(template, placeholder), { encoding: 'utf8', flag: "w" });
        }
    } catch (err) {
        throw err;
    }
};
