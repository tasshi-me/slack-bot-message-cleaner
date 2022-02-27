# slack-bot-message-cleaner

[![standard-readme compliant](https://img.shields.io/badge/standard--readme-OK-green.svg)](https://github.com/RichardLitt/standard-readme)

> Delete slipped bot messages in Slack

## Table of Contents

- [Which messages are deleted?](#which-messages-are-deleted)
- [Install](#install)
- [Usage](#usage)
- [Contribute](#contribute)
- [License](#license)

## Which messages are deleted?

Match to all of followings

- from bot account (has bot id)
- no reactions
- no replies
- no pinning
- no star

## Install

```shell
$ yarn
```

## Usage

```shell
$ SLACK_TOKEN=<your User OAuth Token>
$ CHANNELS=<target channels separeted with comma>
$ yarn start
```

You need Slack `User OAuth Token` with following permissions

- channels:history
- channels:read
- chat:write
- files:read
- groups:history
- groups:read
- im:history
- im:read
- mpim:history
- mpim:read

## Contribute

PRs accepted.

## License

MIT © mshrtsr
