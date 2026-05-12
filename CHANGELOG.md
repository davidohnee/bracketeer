# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.5.1] - 2026-04-19

### Fixed

- About section could not be loaded in viewer mode
- Prevent overflowing release notes

## [1.5.0] - 2026-04-19

### Added

- Show release notes (#90)
- Support JSON editing (#74)
- New about section that shows the tournament format (#56)
    - Editable rules section (#102)

### Changed

- Split configuration into multiple tabs (#95)
- Support multiple share accounts (#99)
    - Add setup instructions
- Updated dependencies

### Fixed

- Don't show the "edit" icon on titles in viewer mode

## [1.4.2] - 2026-03-28

### Security

- Updated dependencies

### Fixed

- teams of scheduled matches in the first knockout round will be unassigned or updated, if the previous phase is modified
    - previously, the knockout view would show the previously assigned teams, even if the table changed
- knockout matches were not always updated automatically (#88)
- fix context menu positions on scrolled content (#87)

## [1.4.1] - 2026-03-22

### Security

- Address sonarqube issues (typescript:S4325)
- Update dependencies

## [1.4.0] - 2026-03-21

### Added

- Introduce customisable tie breakers for custom ranking rules (#46)
- Allow editing court & time in match editor (#55)
- Show proper warnings if knockout team count is invalid (#79)

### Security

- Updated dependencies

### Fixed

- Fix share link in created gists (#82)
- Hide push option if connected remote is a different user (#83)
    - Will be further improved in a future version (#84)
- Hide tournament context menu in read-only mode

## [1.3.0] - 2026-03-02

### Added

- The title of tournaments can now be changed (#75)
- Greatly improved share flow
    - You can now share, download or delete a tournament from all the tournament views
    - The instructions to share have been simplified
    - Share now provides a loading indicator, while the link is loading
    - The settings page shows the currently linked remote and either a share or push/pull options

### Changed

- Knockout phase now automatically adds a play-in round, if needed (#49)
    - For example, if 32 teams participate in the group stage and 24 progress to the knockout stage, the top eight teams will receive a bye, while teams ranked ninth to 24th will compete in a play-in to determine the first-round participants.
    - This is done automatically and can currently not be influenced
    - Further improvements to the knockout phase configuration are planned in #79

### Fixed

- Editing a match plan directly after creating a tournament caused an exception

## [1.2.2] - 2026-02-13

### Security

- Address sonarqube issues

## [1.2.1] - 2026-02-07

### Added

- The start time of tournaments can now be changed after _creating_ the tournament (#47)

### Fixed

- Match view: rounds in different phases with the same name are now considered different and can be switched between (#48)
- Tournaments can be shared again

## [1.2.0] - 2025-10-26

### Added

- Matches can now include optional sets - automatically synced with game scores, but always under your control if you need to override.
- Start off with tournament templates to skip the setup.
- The match list now comes with filters, so you can find exactly what you’re looking for. (#16)
- The match list now auto-splits into intuitive tabs for easier navigation. (#36)
- Unbalanced groups (of different sizes) are now supported.
- The advancing team in knockout phases now stands out.
- Subtle visual improvements throughout.

## [1.1.0] - 2025-07-24

### Added

- The group phase now supports multiple groups, not just one big league. (#17)
- Editors can now manually proceed rounds right from the live view.
- Viewers now see the last sync date, so they always know how fresh the info is.

### Changed

- The tournament creator was reworked and streamlined—fewer clicks, fewer headaches.

## [1.0.1] - 2025-05-14

### Changed

- Refactoring

## [1.0.0] - 2025-05-14

### Added

- Automatic bracket & match generation
- Let everyone follow the action live on their phones with a scannable QR code. No more shouting scores across the room — just scan, follow, and cheer from anywhere.
