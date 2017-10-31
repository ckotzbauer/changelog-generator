/*

Source format:

 {
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


 Dest format:

 {
     hash: string,
     title: string,
     timestamp: number,
     category: string
 }

*/

process.bin = process.title = 'changelog-generator';

const gitCommits = require('git-commits');
const path = require("path");
const _ = require("lodash");
const Mustache = require("mustache");
const fs = require("fs");
const prependFile = require('prepend-file');
const simpleGit = require('simple-git');

const dir = process.cwd();
const repoPath = path.resolve(dir, '.git');
const version = require(path.resolve(dir, 'package.json')).version;

let rawCommits = [];

simpleGit(dir).tags((err, tags) => {
    if (err) {
        throw err;
    }

    const t = tags.all;
    const rev = t.length === 0 ? "HEAD" : `${t[0]}..HEAD`;

    buildChangelog(rev);
});

function buildChangelog(rev) {
    gitCommits(repoPath, {
        rev: rev
    }).on('data', (commit) => {
        if (commit.title.indexOf("Merge branch") === -1 && commit.title.indexOf("Merge remote-tracking branch") === -1) {
            rawCommits.push({ hash: commit.hash.substr(0, 8), title: commit.title, timestamp: commit.author.timestamp });
        }
    }).on('error', (err) => {
        throw err;
    }).on('end', () => {
        if (rawCommits.length === 0) {
            return;
        }

        _.each(rawCommits, (commit) => {
            const c = reformatCommit(commit);
            commit.title = c.message;
            commit.category = c.category;
        });

        rawCommits = _.sortBy(rawCommits, ["category", "timestamp"]);

        const template = fs.readFileSync(path.resolve(__dirname, 'version.mustache'), 'utf8');
        const rendered = Mustache.render(template, { commits: rawCommits, version: version, date: new Date().toISOString().substr(0, 10) });

        prependFile.sync(path.resolve(dir, "CHANGELOG.md"), rendered);
    });
}

function reformatCommit(commit) {
    let index = commit.title.indexOf(":");
    let category = "chore";
    let message = "";

    if (index === commit.title.indexOf(":)") || index === commit.title.indexOf(":(")) {
        index = -1;
    }

    if (index > 0) {
        category = commit.title.substr(0, index).trim();
        message = commit.title.substr(index + 1).trim();
    } else {
        message = commit.title.trim();
    }

    return { message: message, category: category };
}
