import { resolve } from 'path';
import { readFile } from 'fs/promises';
import prependFile from 'prepend-file';
import simpleGit from 'simple-git';
import { Commit, ChangelogItem, Options } from './types';
import Mustache from 'mustache';
const gitCommits = require('git-commits');

const reformatCommit: (m: string) => { title: string, category: string } = (message: string): { title: string, category: string } => {
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

    return { title, category };
}

const fetchChangelogItems: (repoPath: string, rev: string) => Promise<ChangelogItem[]> = async function (repoPath: string, rev: string): Promise<ChangelogItem[]> {
    return new Promise((resolve: (c: ChangelogItem[]) => void, reject: (e: Error) => void) => {
        const items: ChangelogItem[] = [];

        gitCommits(repoPath, { rev })
            .on('data', (commit: Commit) => {
                if (commit.title.indexOf('Merge branch') === -1 && commit.title.indexOf('Merge remote-tracking branch') === -1) {
                    const { title, category } = reformatCommit(commit.title);
                    items.push({
                        hash: commit.hash.substr(0, 8),
                        title: title,
                        category,
                        timestamp: commit.author.timestamp
                    });
                }
            }).on('error', reject)
            .on('end', () => resolve(items));
    });
};

export const generate: (o: Options) => Promise<void> = async function (o: Options): Promise<void> {
    try {
        const repoPath = resolve(o.repository, '.git');

        const tags = await simpleGit(o.repository).tags();
        const t = tags.all;
        const rev = t.length === 0 ? 'HEAD' : `${t[t.length - 1]}..HEAD`;
        let items: ChangelogItem[] = await fetchChangelogItems(repoPath, rev);

        if (items.length === 0) {
            return;
        }

        items = items.sort((a: ChangelogItem, b: ChangelogItem): number => {
            if (a.category !== b.category) {
                return a.category.localeCompare(b.category);
            }

            if (o.ascending) {
                return a.timestamp - b.timestamp;
            } else {
                return b.timestamp - a.timestamp;
            }
        });

        const template = await readFile(resolve(__dirname, '..', `${o.template}.mustache`), 'utf8');
        const rendered = Mustache.render(template, {
            items,
            version: o.releaseVersion,
            date: o.releaseDate,
            notableChanges: o.notableChanges,
            githubHandle: o.githubHandle
        });

        await prependFile(resolve(o.repository, o.file), rendered);
    } catch (err) {
        throw err;
    }
};
