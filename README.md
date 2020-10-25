
# Changelog Generator

```
$ changelog-generator
Usage: changelog-generator [options]

Options:
  -V, --version                output the version number
  -t, --template <name>        template to use (default: "github")
  -a, --ascending              sort commits ascending by date (default: false)
  --release-date <date>        date of release to build (default: "<current date>")
  --release-version <version>  version of release
  -f, --file <file>            path of changelog file (default: "CHANGELOG.md")
  --commit-output <file>       path of commit-list file
  -r, --repository <repo>      path of git repository (default: "<cwd>")
  -n, --notable-changes        insert notable changes block (default: false)
  --github-handle <handle>     github org-repo handle
  -h, --help                   display help for command
```
