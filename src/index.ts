(process as any).bin = process.title = 'changelog-generator';

import { Command } from 'commander';
import { resolve } from 'path';
import { generate } from './generator';
import { Options } from './types';

const program = new Command();
program.version(require(resolve(`${__dirname}/../package.json`)).version);
program.name('changelog-generator');
program
    .option('-t, --template <name>', 'template to use', 'github')
    .option('-a, --ascending', 'sort commits ascending by date', false)
    .option('--release-date <date>', 'date of release to build', new Date().toISOString().substr(0, 10))
    .option('--release-version <version>', 'version of release')
    .option('-f, --file <file>', 'path of changelog file', 'CHANGELOG.md')
    .option('--commit-output <file>', 'path of commit-list file')
    .option('-r, --repository <repo>', 'path of git repository', process.cwd())
    .option('-n, --notable-changes', 'insert notable changes block', false)
    .option('--github-handle <handle>', 'github org-repo handle');

program.parse(process.argv);

if (!program.releaseVersion) {
    program.releaseVersion = require(resolve(`${program.repository}/package.json`)).version;
}

generate(program.opts() as Options);
