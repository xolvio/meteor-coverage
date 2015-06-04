# IMPORTANT NOTICE

This project is on hold until we figure out how to post pre-process source files with Meteor. There is [a proposal in the works at the MDG](https://meteor.hackpad.com/Proposal-New-phases-for-the-build-process-KQ8jqchouGs) around the build process and extending it. We're hoping to resume work on this package once we figure out the right way to do it with Velocity.

Thanks for your patience, we want this package as much as you do :)

#Get the Book
To learn more about testing with Meteor, consider purchasing our book [The Meteor Testing Manual](http://www.meteortesting.com/?utm_source=coverage&utm_medium=banner&utm_campaign=coverage).

[![](http://www.meteortesting.com/img/tmtm.gif)](http://www.meteortesting.com/?utm_source=coverage&utm_medium=banner&utm_campaign=coverage)

Your support helps us continue our work on Velocity and related frameworks.

# Velocity-Coverage

Uses [Istanbul](http://gotwarlost.github.io/istanbul/) to instrument your meteor app code. When all test frameworks have completed, velocity-coverage collects code coverage from all mirrors and connected clients, aggregates the coverage reports into one report and serves them to `<base_url>/coverage`

This package will even collect coverage reports prior to a test navigating away from the meteor app!

## Usage

mrt add velocity-coverage

You can now use velocity as usual and you'll get coverage reports if you go to `<base_url>/coverage`

#### Example app

Checkout the velocity example app and add the coverage package to see a demo:

```bash
$ cd ~/tmp
$ git clone https://github.com/xolvio/velocity-example.git
$ cd velocity-example
$ mrt add velocity-coverage
```

Then you can start the app:

```bash
$ mrt
```

You'll see the leaderboard example started on port 3000, and once the tests have completed, you'll see a coverage report at `localhost:3000/coverage`

