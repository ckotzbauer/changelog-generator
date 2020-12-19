import { resolve } from 'path';
import { readFile, writeFile } from 'fs/promises';
import prependFile from 'prepend-file';
import simpleGit, { SimpleGit } from 'simple-git';
import { ChangelogItem, Options } from './types';
import Mustache from 'mustache';

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

const fetchChangelogItems: (git: SimpleGit, from: string, asc: boolean) => Promise<ChangelogItem[]> = async function (git: SimpleGit, from: string, asc: boolean): Promise<ChangelogItem[]> {
    const commits = await git.log({ to: "HEAD", from });
    return commits.all
        .map(commit => {
            if (commit.message.indexOf('Merge branch') === -1 && commit.message.indexOf('Merge remote-tracking branch') === -1) {
                const { title, category } = reformatCommit(commit.message);
                return {
                    hash: commit.hash.substr(0, 8),
                    title,
                    category,
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
};

export const generate: (o: Options) => Promise<void> = async function (o: Options): Promise<void> {
    try {
        const git = simpleGit(o.repository);

        const tags = await git.tags();
        const t = tags.all;
        const from = t.length === 0 ? null : t[t.length - 1];
        let items: ChangelogItem[] = await fetchChangelogItems(git, from, o.ascending);

        if (items.length === 0) {
            return;
        }

        const template = await readFile(resolve(__dirname, '..', `${o.template}.mustache`), 'utf8');
        const placeholder = {
            items,
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
