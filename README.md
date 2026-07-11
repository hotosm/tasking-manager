# Tasking Manager

[![DPG Badge](https://img.shields.io/badge/Verified-DPG-3333AB?logo=data:image/svg%2bxml;base64,PHN2ZyB3aWR0aD0iMzEiIGhlaWdodD0iMzMiIHZpZXdCb3g9IjAgMCAzMSAzMyIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTE0LjIwMDggMjEuMzY3OEwxMC4xNzM2IDE4LjAxMjRMMTEuNTIxOSAxNi40MDAzTDEzLjk5MjggMTguNDU5TDE5LjYyNjkgMTIuMjExMUwyMS4xOTA5IDEzLjYxNkwxNC4yMDA4IDIxLjM2NzhaTTI0LjYyNDEgOS4zNTEyN0wyNC44MDcxIDMuMDcyOTdMMTguODgxIDUuMTg2NjJMMTUuMzMxNCAtMi4zMzA4MmUtMDVMMTEuNzgyMSA1LjE4NjYyTDUuODU2MDEgMy4wNzI5N0w2LjAzOTA2IDkuMzUxMjdMMCAxMS4xMTc3TDMuODQ1MjEgMTYuMDg5NUwwIDIxLjA2MTJMNi4wMzkwNiAyMi44Mjc3TDUuODU2MDEgMjkuMTA2TDExLjc4MjEgMjYuOTkyM0wxNS4zMzE0IDMyLjE3OUwxOC44ODEgMjYuOTkyM0wyNC44MDcxIDI5LjEwNkwyNC42MjQxIDIyLjgyNzdMMzAuNjYzMSAyMS4wNjEyTDI2LjgxNzYgMTYuMDg5NUwzMC42NjMxIDExLjExNzdMMjQuNjI0MSA5LjM1MTI3WiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+Cg==)](https://digitalpublicgoods.net/r/hot-tasking-manager)
[![hotosm](https://dl.circleci.com/status-badge/img/gh/hotosm/tasking-manager/tree/develop.svg?style=shield)](https://dl.circleci.com/status-badge/redirect/gh/hotosm/tasking-manager/tree/develop)
[![TM Backend on Quay](https://quay.io/repository/hotosm/tasking-manager/status "Tasking Manager Backend Build")](https://quay.io/repository/hotosm/tasking-manager)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=hotosm_tasking-manager&metric=alert_status)](https://sonarcloud.io/dashboard?id=hotosm_tasking-manager)
[![All Contributors](https://img.shields.io/badge/all--contributors-115%20-orange.svg?style=flat-square)](#contributors-)

![tm-landing-page](./docs/images/screenshot.jpg)

The most popular tool for teams to coordinate mapping on OpenStreetMap. With this web application, an area of interest can be defined and divided up into smaller tasks that can be completed rapidly. It shows which areas need to be mapped and which areas need a review for quality assurance. You can see the tool in action: log into the widely used [HOT Tasking Manager](https://tasks.hotosm.org/) and start mapping.

This is Free and Open Source Software. You are welcome to use the code and set up your own instance. The Tasking Manager has been initially designed and built by and for the [Humanitarian OpenStreetMap Team](https://www.hotosm.org/), and is nowadays used by many communities and organizations.

## Get involved!

* Start by reading our [Code of conduct](docs/developers/code_of_conduct.md)
* Get familiar with our [contributor guidelines](docs/developers/contributing.md) explaining the different ways in which you can support this project! We need your help!
* Join the Tasking Manager Collective Meet up - an opportunity to meet other Tasking Manager contributors. The meet ups take place on the second Wednesday of the month at 9:00 or 15:00UTC! Register to receive a calendar invite: https://bit.ly/3s6ntmV or join directly via this link: https://meet.jit.si/TaskingManagerCollectiveMeetUp
* Read the monthly update blogs on [OSM Discourse](https://community.openstreetmap.org/c/general/38/all).

## Product Roadmap


✅ Completed: Finished, available on [production instance](https://tasks.hotosm.org)

🔄 In Progress: Task or milestone is actively being worked on

📅 Planned: Task or milestone is scheduled for a future date



Status | Feature | Release
-------|---------|---------
✅ | Up-to-date OSM Statistics: Integrated with [ohsome Now](https://stats.now.ohsome.org/) for real-time data insights.| Released in [v4.6.2](https://github.com/hotosm/tasking-manager/releases/tag/v4.6.2).


### 2024

Status | Feature | Release
-------|---------|---------
✅ | Downloadable OSM Exports: Export data directly from each project. | Available in[ v4.7.0](https://github.com/hotosm/tasking-manager/releases/tag/v4.7.0).
✅ | Rapid Editor Upgrade: Enhanced mapping experience with the latest rapid editor updates.| Last updated in [v4.8.2](https://github.com/hotosm/tasking-manager/releases/tag/v4.8.2)
✅ | Public-Facing Partner Pages: Create and display dedicated pages for partners running remote mapathons.| [v4.8.2](https://github.com/hotosm/tasking-manager/releases/tag/v4.8.2)
✅ | Downloadable Project List View: Allow users to explore projects via a downloadable list. [View issue](https://github.com/hotosm/tasking-manager/issues/3394).| [v4.8.2](https://github.com/hotosm/tasking-manager/releases/tag/v4.8.2)
✅ | MapSwipe Stats Integration: Display MapSwipe statistics on Partner Pages.|[v4.8.2](https://github.com/hotosm/tasking-manager/releases/tag/v4.8.2)


### 2025

Status | Feature | Release
-------|---------|---------
✅ | FastAPI Migration: Improve performance and scalability of Tasking Manager to handle large scale validation and mapping efforts.| [v5 launch 🎉](https://github.com/hotosm/tasking-manager/releases/tag/v5.0.0)
✅ | iD Editor Latest Features: Integrate the newest features of the iD editor.|[v5.0.5](https://github.com/hotosm/tasking-manager/releases/tag/v5.0.5)
✅ | Super Mapper: Redefine Mapper Level Milestones | [v5.2.0](https://github.com/hotosm/tasking-manager/releases/tag/v5.2.0)
✅ | Ability to unlink projects and subsequent team deletion | [v5.3.1](https://github.com/hotosm/tasking-manager/releases/tag/v5.3.1)
✅ | User account deletion (self-service + admin initiated) | [v5.4.0](https://github.com/hotosm/tasking-manager/releases/tag/v5.4.0)

### 2026

Status | Feature | Release
-------|---------|---------
✅ | Markdown support in Project Q&A | [v5.4.1](https://github.com/hotosm/tasking-manager/releases/tag/v5.4.1)
✅ | Improved panel arrangement in task contribution section | [v5.4.1](https://github.com/hotosm/tasking-manager/releases/tag/v5.4.1)
✅ | OSM Practice Projects (sandbox): Enable users to engage in OSM practice projects within Tasking Manager workflow. |[v5.5](https://github.com/hotosm/tasking-manager/releases/tag/v5.5)
✅ | Complete migration to MapLibre libraries | [v5.5](https://github.com/hotosm/tasking-manager/releases/tag/v5.5)
✅ | [Digital Public Goods](https://www.digitalpublicgoods.net/registry) badge display | [v5.5](https://github.com/hotosm/tasking-manager/releases/tag/v5.5)
✅ | Filter by imagery type using API | [v5.5](https://github.com/hotosm/tasking-manager/releases/tag/v5.5)
✅ | Backend support for messaging all Campaign Contributors | [v5.5](https://github.com/hotosm/tasking-manager/releases/tag/v5.5)
🔄 | Allow data downloads for sandbox projects through frontend |
🔄 | Custom data reference layer for sandbox projects |
🔄 | Choropleth layer to highlight most invalidated tasks |
🔄 | Dependency & Framework health check |
🔄 | Additional imagery filter under explore projects section |
📅 | Expanding Project Types beyond basemap features
📅 | AI Integration: task assignment, difficulty estimation, and validation
📅 | External tools Integration: MapSwipe, uMap, Maproulette
📅 | Latest Translations Update: Keep all content current with the latest translations.
📅 | Improved Project Sorting & Filtering: Enhance the user experience with better sorting and filtering options.
📅 | UI/UX Enhancements: Continuous improvements to the user interface and experience.





## Contributors ✨

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tbody>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/willemarcel"><img src="https://avatars.githubusercontent.com/u/666291?v=4?s=100" width="100px;" alt="Wille Marcel"/><br /><sub><b>Wille Marcel</b></sub></a><br /><a href="https://github.com/hotosm/tasking-manager/commits?author=willemarcel" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/ramyaragupathy"><img src="https://avatars.githubusercontent.com/u/12103383?v=4?s=100" width="100px;" alt="Ramya Ragupathy"/><br /><sub><b>Ramya Ragupathy</b></sub></a><br /><a href="https://github.com/hotosm/tasking-manager/commits?author=ramyaragupathy" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/HelNershingThapa"><img src="https://avatars.githubusercontent.com/u/51614993?v=4?s=100" width="100px;" alt="Hel Nershing Thapa"/><br /><sub><b>Hel Nershing Thapa</b></sub></a><br /><a href="https://github.com/hotosm/tasking-manager/commits?author=HelNershingThapa" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/Aadesh-Baral"><img src="https://avatars.githubusercontent.com/u/67958673?v=4?s=100" width="100px;" alt="Aadesh Baral"/><br /><sub><b>Aadesh Baral</b></sub></a><br /><a href="https://github.com/hotosm/tasking-manager/commits?author=Aadesh-Baral" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/hunt3ri"><img src="https://avatars.githubusercontent.com/u/1523510?v=4?s=100" width="100px;" alt="Iain Hunter"/><br /><sub><b>Iain Hunter</b></sub></a><br /><a href="https://github.com/hotosm/tasking-manager/commits?author=hunt3ri" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/prabinoid"><img src="https://avatars.githubusercontent.com/u/38830224?v=4?s=100" width="100px;" alt="Prabin Pathak"/><br /><sub><b>Prabin Pathak</b></sub></a><br /><a href="https://github.com/hotosm/tasking-manager/commits?author=prabinoid" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/dakotabenjamin"><img src="https://avatars.githubusercontent.com/u/1847818?v=4?s=100" width="100px;" alt="DK Benjamin"/><br /><sub><b>DK Benjamin</b></sub></a><br /><a href="https://github.com/hotosm/tasking-manager/commits?author=dakotabenjamin" title="Code">💻</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/eternaltyro"><img src="https://avatars.githubusercontent.com/u/230743?v=4?s=100" width="100px;" alt="Yogesh"/><br /><sub><b>Yogesh</b></sub></a><br /><a href="https://github.com/hotosm/tasking-manager/commits?author=eternaltyro" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/suzit-10"><img src="https://avatars.githubusercontent.com/u/90745363?v=4?s=100" width="100px;" alt="Sujit"/><br /><sub><b>Sujit</b></sub></a><br /><a href="https://github.com/hotosm/tasking-manager/commits?author=suzit-10" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/LindaAlblas"><img src="https://avatars.githubusercontent.com/u/3329074?v=4?s=100" width="100px;" alt="Linda Alblas"/><br /><sub><b>Linda Alblas</b></sub></a><br /><a href="https://github.com/hotosm/tasking-manager/commits?author=LindaAlblas" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/ethan-nelson"><img src="https://avatars.githubusercontent.com/u/8998918?v=4?s=100" width="100px;" alt="Ethan Nelson"/><br /><sub><b>Ethan Nelson</b></sub></a><br /><a href="https://github.com/hotosm/tasking-manager/commits?author=ethan-nelson" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/JorgeMrtnzG"><img src="https://avatars.githubusercontent.com/u/3285923?v=4?s=100" width="100px;" alt="Jorge Martínez Gómez"/><br /><sub><b>Jorge Martínez Gómez</b></sub></a><br /><a href="https://github.com/hotosm/tasking-manager/commits?author=JorgeMrtnzG" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/royallsilwallz"><img src="https://avatars.githubusercontent.com/u/51167861?v=4?s=100" width="100px;" alt="Royall Silwallz"/><br /><sub><b>Royall Silwallz</b></sub></a><br /><a href="https://github.com/hotosm/tasking-manager/commits?author=royallsilwallz" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/pantierra"><img src="https://avatars.githubusercontent.com/u/97706?v=4?s=100" width="100px;" alt="xıʃǝɟ"/><br /><sub><b>xıʃǝɟ</b></sub></a><br /><a href="https://github.com/hotosm/tasking-manager/commits?author=pantierra" title="Code">💻</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/categulario"><img src="https://avatars.githubusercontent.com/u/790756?v=4?s=100" width="100px;" alt="Abraham Toriz Cruz"/><br /><sub><b>Abraham Toriz Cruz</b></sub></a><br /><a href="https://github.com/hotosm/tasking-manager/commits?author=categulario" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/VinayakRugvedi"><img src="https://avatars.githubusercontent.com/u/25401480?v=4?s=100" width="100px;" alt="A Vinayak Rugvedi"/><br /><sub><b>A Vinayak Rugvedi</b></sub></a><br /><a href="https://github.com/hotosm/tasking-manager/commits?author=VinayakRugvedi" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/feenster"><img src="https://avatars.githubusercontent.com/u/16537909?v=4?s=100" width="100px;" alt="Ian Feeney"/><br /><sub><b>Ian Feeney</b></sub></a><br /><a href="https://github.com/hotosm/tasking-manager/commits?author=feenster" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/bshankar"><img src="https://avatars.githubusercontent.com/u/1161104?v=4?s=100" width="100px;" alt="Bhavani Shankar"/><br /><sub><b>Bhavani Shankar</b></sub></a><br /><a href="https://github.com/hotosm/tasking-manager/commits?author=bshankar" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/tsmock"><img src="https://avatars.githubusercontent.com/u/45215054?v=4?s=100" width="100px;" alt="Taylor Smock"/><br /><sub><b>Taylor Smock</b></sub></a><br /><a href="https://github.com/hotosm/tasking-manager/commits?author=tsmock" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/nischalstha9"><img src="https://avatars.githubusercontent.com/u/39024181?v=4?s=100" width="100px;" alt="Nischal Shrestha"/><br /><sub><b>Nischal Shrestha</b></sub></a><br /><a href="https://github.com/hotosm/tasking-manager/commits?author=nischalstha9" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/d-rita"><img src="https://avatars.githubusercontent.com/u/31903212?v=4?s=100" width="100px;" alt="Diana Nanyanzi"/><br /><sub><b>Diana Nanyanzi</b></sub></a><br /><a href="https://github.com/hotosm/tasking-manager/commits?author=d-rita" title="Code">💻</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/spwoodcock"><img src="https://avatars.githubusercontent.com/u/78538841?v=4?s=100" width="100px;" alt="Sam"/><br /><sub><b>Sam</b></sub></a><br /><a href="https://github.com/hotosm/tasking-manager/commits?author=spwoodcock" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/smit1678"><img src="https://avatars.githubusercontent.com/u/796838?v=4?s=100" width="100px;" alt="Nate Smith"/><br /><sub><b>Nate Smith</b></sub></a><br /><a href="https://github.com/hotosm/tasking-manager/commits?author=smit1678" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/bgirardot"><img src="https://avatars.githubusercontent.com/u/265831?v=4?s=100" width="100px;" alt="Blake Girardot"/><br /><sub><b>Blake Girardot</b></sub></a><br /><a href="https://github.com/hotosm/tasking-manager/commits?author=bgirardot" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/mahesh-naxa"><img src="https://avatars.githubusercontent.com/u/72002075?v=4?s=100" width="100px;" alt="Mahesh-wor 'Invoron'"/><br /><sub><b>Mahesh-wor 'Invoron'</b></sub></a><br /><a href="https://github.com/hotosm/tasking-manager/commits?author=mahesh-naxa" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/varun2948"><img src="https://avatars.githubusercontent.com/u/37866666?v=4?s=100" width="100px;" alt="Deepak Pradhan"/><br /><sub><b>Deepak Pradhan</b></sub></a><br /><a href="https://github.com/hotosm/tasking-manager/commits?author=varun2948" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/bgirardot-np"><img src="https://avatars.githubusercontent.com/u/12796805?v=4?s=100" width="100px;" alt="Blake Girardot - No Priv"/><br /><sub><b>Blake Girardot - No Priv</b></sub></a><br /><a href="https://github.com/hotosm/tasking-manager/commits?author=bgirardot-np" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/NoemiNahomy"><img src="https://avatars.githubusercontent.com/u/1789542?v=4?s=100" width="100px;" alt="Noemi Nahomy"/><br /><sub><b>Noemi Nahomy</b></sub></a><br /><a href="https://github.com/hotosm/tasking-manager/commits?author=NoemiNahomy" title="Code">💻</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/emi420"><img src="https://avatars.githubusercontent.com/u/1226194?v=4?s=100" width="100px;" alt="Emilio Mariscal"/><br /><sub><b>Emilio Mariscal</b></sub></a><br /><a href="https://github.com/hotosm/tasking-manager/commits?author=emi420" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/kaditya97"><img src="https://avatars.githubusercontent.com/u/50064160?v=4?s=100" width="100px;" alt="Aditya Kushwaha"/><br /><sub><b>Aditya Kushwaha</b></sub></a><br /><a href="https://github.com/hotosm/tasking-manager/commits?author=kaditya97" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/nrotstan"><img src="https://avatars.githubusercontent.com/u/445970?v=4?s=100" width="100px;" alt="Neil Rotstan"/><br /><sub><b>Neil Rotstan</b></sub></a><br /><a href="https://github.com/hotosm/tasking-manager/commits?author=nrotstan" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/sumitdahal7"><img src="https://avatars.githubusercontent.com/u/39086521?v=4?s=100" width="100px;" alt="Sumit Dahal"/><br /><sub><b>Sumit Dahal</b></sub></a><br /><a href="https://github.com/hotosm/tasking-manager/commits?author=sumitdahal7" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/fitoria"><img src="https://avatars.githubusercontent.com/u/9713?v=4?s=100" width="100px;" alt="Adolfo Fitoria"/><br /><sub><b>Adolfo Fitoria</b></sub></a><br /><a href="https://github.com/hotosm/tasking-manager/commits?author=fitoria" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/david-hotosm"><img src="https://avatars.githubusercontent.com/u/25679322?v=4?s=100" width="100px;" alt="David Vasandani"/><br /><sub><b>David Vasandani</b></sub></a><br /><a href="https://github.com/hotosm/tasking-manager/commits?author=david-hotosm" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/robsavoye"><img src="https://avatars.githubusercontent.com/u/71342768?v=4?s=100" width="100px;" alt="Rob Savoye"/><br /><sub><b>Rob Savoye</b></sub></a><br /><a href="https://github.com/hotosm/tasking-manager/commits?author=robsavoye" title="Code">💻</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/sunidhiraheja"><img src="https://avatars.githubusercontent.com/u/36561389?v=4?s=100" width="100px;" alt="Sunidhi Raheja"/><br /><sub><b>Sunidhi Raheja</b></sub></a><br /><a href="https://github.com/hotosm/tasking-manager/commits?author=sunidhiraheja" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/Anuj-Gupta4"><img src="https://avatars.githubusercontent.com/u/84966248?v=4?s=100" width="100px;" alt="Anuj Gupta"/><br /><sub><b>Anuj Gupta</b></sub></a><br /><a href="https://github.com/hotosm/tasking-manager/commits?author=Anuj-Gupta4" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/CristianAmici"><img src="https://avatars.githubusercontent.com/u/72893031?v=4?s=100" width="100px;" alt="CristianAmici"/><br /><sub><b>CristianAmici</b></sub></a><br /><a href="https://github.com/hotosm/tasking-manager/commits?author=CristianAmici" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/kshitijrajsharma"><img src="https://avatars.githubusercontent.com/u/36752999?v=4?s=100" width="100px;" alt="Kshitij"/><br /><sub><b>Kshitij</b></sub></a><br /><a href="https://github.com/hotosm/tasking-manager/commits?author=kshitijrajsharma" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/fiennyangeln"><img src="https://avatars.githubusercontent.com/u/24544912?v=4?s=100" width="100px;" alt="Fienny Angelina"/><br /><sub><b>Fienny Angelina</b></sub></a><br /><a href="https://github.com/hotosm/tasking-manager/commits?author=fiennyangeln" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/pgiraud"><img src="https://avatars.githubusercontent.com/u/319774?v=4?s=100" width="100px;" alt="Pierre GIRAUD"/><br /><sub><b>Pierre GIRAUD</b></sub></a><br /><a href="https://github.com/hotosm/tasking-manager/commits?author=pgiraud" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/petya-kangalova"><img src="https://avatars.githubusercontent.com/u/98902727?v=4?s=100" width="100px;" alt="Petya "/><br /><sub><b>Petya </b></sub></a><br /><a href="https://github.com/hotosm/tasking-manager/commits?author=petya-kangalova" title="Code">💻</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/mtalhabaig3"><img src="https://avatars.githubusercontent.com/u/57634631?v=4?s=100" width="100px;" alt="Muhammad Talha Baig"/><br /><sub><b>Muhammad Talha Baig</b></sub></a><br /><a href="https://github.com/hotosm/tasking-manager/commits?author=mtalhabaig3" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/sudeep-io"><img src="https://avatars.githubusercontent.com/u/35025525?v=4?s=100" width="100px;" alt="Sudeep Puri"/><br /><sub><b>Sudeep Puri</b></sub></a><br /><a href="https://github.com/hotosm/tasking-manager/commits?author=sudeep-io" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/vegeta999"><img src="https://avatars.githubusercontent.com/u/34532173?v=4?s=100" width="100px;" alt="vegeta999"/><br /><sub><b>vegeta999</b></sub></a><br /><a href="https://github.com/hotosm/tasking-manager/commits?author=vegeta999" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/alekno"><img src="https://avatars.githubusercontent.com/u/32923310?v=4?s=100" width="100px;" alt="alekno"/><br /><sub><b>alekno</b></sub></a><br /><a href="https://github.com/hotosm/tasking-manager/commits?author=alekno" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/thadk"><img src="https://avatars.githubusercontent.com/u/283343?v=4?s=100" width="100px;" alt="Thad Kerosky"/><br /><sub><b>Thad Kerosky</b></sub></a><br /><a href="https://github.com/hotosm/tasking-manager/commits?author=thadk" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/lesserj"><img src="https://avatars.githubusercontent.com/u/2304500?v=4?s=100" width="100px;" alt="Jacob Lesser"/><br /><sub><b>Jacob Lesser</b></sub></a><br /><a href="https://github.com/hotosm/tasking-manager/commits?author=lesserj" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/joaovitor3"><img src="https://avatars.githubusercontent.com/u/18130942?v=4?s=100" width="100px;" alt="João Vitor Ramos"/><br /><sub><b>João Vitor Ramos</b></sub></a><br /><a href="https://github.com/hotosm/tasking-manager/commits?author=joaovitor3" title="Code">💻</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/frafra"><img src="https://avatars.githubusercontent.com/u/4068?v=4?s=100" width="100px;" alt="Francesco Frassinelli"/><br /><sub><b>Francesco Frassinelli</b></sub></a><br /><a href="https://github.com/hotosm/tasking-manager/commits?author=frafra" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/rsavoye"><img src="https://avatars.githubusercontent.com/u/1679340?v=4?s=100" width="100px;" alt="Rob Savoye"/><br /><sub><b>Rob Savoye</b></sub></a><br /><a href="https://github.com/hotosm/tasking-manager/commits?author=rsavoye" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/Hulios"><img src="https://avatars.githubusercontent.com/u/2526659?v=4?s=100" width="100px;" alt="Hulios"/><br /><sub><b>Hulios</b></sub></a><br /><a href="https://github.com/hotosm/tasking-manager/commits?author=Hulios" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/uwaiszaki"><img src="https://avatars.githubusercontent.com/u/32809190?v=4?s=100" width="100px;" alt="uwais zaki"/><br /><sub><b>uwais zaki</b></sub></a><br /><a href="https://github.com/hotosm/tasking-manager/commits?author=uwaiszaki" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/arunasank"><img src="https://avatars.githubusercontent.com/u/3166852?v=4?s=100" width="100px;" alt="S Aruna"/><br /><sub><b>S Aruna</b></sub></a><br /><a href="https://github.com/hotosm/tasking-manager/commits?author=arunasank" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/anilrajrimal1"><img src="https://avatars.githubusercontent.com/u/119393936?v=4?s=100" width="100px;" alt="Anil Raj Rimal"/><br /><sub><b>Anil Raj Rimal</b></sub></a><br /><a href="https://github.com/hotosm/tasking-manager/commits?author=anilrajrimal1" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/heathdutton"><img src="https://avatars.githubusercontent.com/u/302215?v=4?s=100" width="100px;" alt="Heath Dutton🕴️"/><br /><sub><b>Heath Dutton🕴️</b></sub></a><br /><a href="https://github.com/hotosm/tasking-manager/commits?author=heathdutton" title="Code">💻</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/faebebin"><img src="https://avatars.githubusercontent.com/u/21113500?v=4?s=100" width="100px;" alt="Fabian Binder"/><br /><sub><b>Fabian Binder</b></sub></a><br /><a href="https://github.com/hotosm/tasking-manager/commits?author=faebebin" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/sethfitz"><img src="https://avatars.githubusercontent.com/u/45?v=4?s=100" width="100px;" alt="Seth Fitzsimmons"/><br /><sub><b>Seth Fitzsimmons</b></sub></a><br /><a href="https://github.com/hotosm/tasking-manager/commits?author=sethfitz" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/Thrazadin"><img src="https://avatars.githubusercontent.com/u/11324002?v=4?s=100" width="100px;" alt="Thrazadin"/><br /><sub><b>Thrazadin</b></sub></a><br /><a href="https://github.com/hotosm/tasking-manager/commits?author=Thrazadin" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/IknowJoseph"><img src="https://avatars.githubusercontent.com/u/1896882?v=4?s=100" width="100px;" alt="Joseph Reeves"/><br /><sub><b>Joseph Reeves</b></sub></a><br /><a href="https://github.com/hotosm/tasking-manager/commits?author=IknowJoseph" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/dkocich"><img src="https://avatars.githubusercontent.com/u/6165660?v=4?s=100" width="100px;" alt="dkocich"/><br /><sub><b>dkocich</b></sub></a><br /><a href="https://github.com/hotosm/tasking-manager/commits?author=dkocich" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/iandees"><img src="https://avatars.githubusercontent.com/u/261584?v=4?s=100" width="100px;" alt="Ian Dees"/><br /><sub><b>Ian Dees</b></sub></a><br /><a href="https://github.com/hotosm/tasking-manager/commits?author=iandees" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/jacobwhall"><img src="https://avatars.githubusercontent.com/u/55111303?v=4?s=100" width="100px;" alt="Jacob Hall"/><br /><sub><b>Jacob Hall</b></sub></a><br /><a href="https://github.com/hotosm/tasking-manager/commits?author=jacobwhall" title="Code">💻</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/NatashaKSS"><img src="https://avatars.githubusercontent.com/u/12412031?v=4?s=100" width="100px;" alt="Natasha Koh"/><br /><sub><b>Natasha Koh</b></sub></a><br /><a href="https://github.com/hotosm/tasking-manager/commits?author=NatashaKSS" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/geohacker"><img src="https://avatars.githubusercontent.com/u/371666?v=4?s=100" width="100px;" alt="Sajjad Anwar"/><br /><sub><b>Sajjad Anwar</b></sub></a><br /><a href="https://github.com/hotosm/tasking-manager/commits?author=geohacker" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/stanleypliu"><img src="https://avatars.githubusercontent.com/u/53650048?v=4?s=100" width="100px;" alt="Stanley Liu"/><br /><sub><b>Stanley Liu</b></sub></a><br /><a href="https://github.com/hotosm/tasking-manager/commits?author=stanleypliu" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/jillhkm"><img src="https://avatars.githubusercontent.com/u/35405244?v=4?s=100" width="100px;" alt="Jill"/><br /><sub><b>Jill</b></sub></a><br /><a href="https://github.com/hotosm/tasking-manager/commits?author=jillhkm" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/Nick-Tallguy"><img src="https://avatars.githubusercontent.com/u/6763965?v=4?s=100" width="100px;" alt="Nick Allen (OSM = Tallguy)"/><br /><sub><b>Nick Allen (OSM = Tallguy)</b></sub></a><br /><a href="https://github.com/hotosm/tasking-manager/commits?author=Nick-Tallguy" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/jayenashar"><img src="https://avatars.githubusercontent.com/u/1137152?v=4?s=100" width="100px;" alt="Jayen Ashar"/><br /><sub><b>Jayen Ashar</b></sub></a><br /><a href="https://github.com/hotosm/tasking-manager/commits?author=jayenashar" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/max-keviv"><img src="https://avatars.githubusercontent.com/u/59287619?v=4?s=100" width="100px;" alt="Vivek Vishal"/><br /><sub><b>Vivek Vishal</b></sub></a><br /><a href="https://github.com/hotosm/tasking-manager/commits?author=max-keviv" title="Code">💻</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/aaj013"><img src="https://avatars.githubusercontent.com/u/5847582?v=4?s=100" width="100px;" alt="Asish Abraham Joseph"/><br /><sub><b>Asish Abraham Joseph</b></sub></a><br /><a href="https://github.com/hotosm/tasking-manager/commits?author=aaj013" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/drklrd"><img src="https://avatars.githubusercontent.com/u/7760502?v=4?s=100" width="100px;" alt="Saurav Bhattarai"/><br /><sub><b>Saurav Bhattarai</b></sub></a><br /><a href="https://github.com/hotosm/tasking-manager/commits?author=drklrd" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/teymour-aldridge"><img src="https://avatars.githubusercontent.com/u/42674621?v=4?s=100" width="100px;" alt="Teymour Aldridge"/><br /><sub><b>Teymour Aldridge</b></sub></a><br /><a href="https://github.com/hotosm/tasking-manager/commits?author=teymour-aldridge" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/mohammadareeb95"><img src="https://avatars.githubusercontent.com/u/77102111?v=4?s=100" width="100px;" alt="Mohammad Areeb"/><br /><sub><b>Mohammad Areeb</b></sub></a><br /><a href="https://github.com/hotosm/tasking-manager/commits?author=mohammadareeb95" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/Bonkles"><img src="https://avatars.githubusercontent.com/u/1887955?v=4?s=100" width="100px;" alt="Ben Clark"/><br /><sub><b>Ben Clark</b></sub></a><br /><a href="https://github.com/hotosm/tasking-manager/commits?author=Bonkles" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/asmigarg04"><img src="https://avatars.githubusercontent.com/u/144546736?v=4?s=100" width="100px;" alt="Asmi Garg"/><br /><sub><b>Asmi Garg</b></sub></a><br /><a href="https://github.com/hotosm/tasking-manager/commits?author=asmigarg04" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/k3KAW8Pnf7mkmdSMPHz27"><img src="https://avatars.githubusercontent.com/u/2598631?v=4?s=100" width="100px;" alt="Jonatan Asketorp"/><br /><sub><b>Jonatan Asketorp</b></sub></a><br /><a href="https://github.com/hotosm/tasking-manager/commits?author=k3KAW8Pnf7mkmdSMPHz27" title="Code">💻</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/Ashik-AD"><img src="https://avatars.githubusercontent.com/u/43263257?v=4?s=100" width="100px;" alt="Ashik Dhimal"/><br /><sub><b>Ashik Dhimal</b></sub></a><br /><a href="https://github.com/hotosm/tasking-manager/commits?author=Ashik-AD" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/WiamSkakri"><img src="https://avatars.githubusercontent.com/u/140335194?v=4?s=100" width="100px;" alt="Wiam Skakri"/><br /><sub><b>Wiam Skakri</b></sub></a><br /><a href="https://github.com/hotosm/tasking-manager/commits?author=WiamSkakri" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/rightway1"><img src="https://avatars.githubusercontent.com/u/10175145?v=4?s=100" width="100px;" alt="Colin Wright "/><br /><sub><b>Colin Wright </b></sub></a><br /><a href="https://github.com/hotosm/tasking-manager/commits?author=rightway1" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/kant"><img src="https://avatars.githubusercontent.com/u/32717?v=4?s=100" width="100px;" alt="Darío Hereñú"/><br /><sub><b>Darío Hereñú</b></sub></a><br /><a href="https://github.com/hotosm/tasking-manager/commits?author=kant" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/dodobas"><img src="https://avatars.githubusercontent.com/u/394314?v=4?s=100" width="100px;" alt="Dražen Odobašić"/><br /><sub><b>Dražen Odobašić</b></sub></a><br /><a href="https://github.com/hotosm/tasking-manager/commits?author=dodobas" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/Ndacyayisenga-droid"><img src="https://avatars.githubusercontent.com/u/58124613?v=4?s=100" width="100px;" alt="Noah Tayebwa "/><br /><sub><b>Noah Tayebwa </b></sub></a><br /><a href="https://github.com/hotosm/tasking-manager/commits?author=Ndacyayisenga-droid" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/erictheise"><img src="https://avatars.githubusercontent.com/u/317680?v=4?s=100" width="100px;" alt="Eric Theise"/><br /><sub><b>Eric Theise</b></sub></a><br /><a href="https://github.com/hotosm/tasking-manager/commits?author=erictheise" title="Code">💻</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/MohanSha"><img src="https://avatars.githubusercontent.com/u/13899668?v=4?s=100" width="100px;" alt="Mohan Sha"/><br /><sub><b>Mohan Sha</b></sub></a><br /><a href="https://github.com/hotosm/tasking-manager/commits?author=MohanSha" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/wireguy"><img src="https://avatars.githubusercontent.com/u/47227325?v=4?s=100" width="100px;" alt="wireguy"/><br /><sub><b>wireguy</b></sub></a><br /><a href="https://github.com/hotosm/tasking-manager/commits?author=wireguy" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/sumukhah"><img src="https://avatars.githubusercontent.com/u/23723464?v=4?s=100" width="100px;" alt="Sumukha Hegde"/><br /><sub><b>Sumukha Hegde</b></sub></a><br /><a href="https://github.com/hotosm/tasking-manager/commits?author=sumukhah" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/stufinn"><img src="https://avatars.githubusercontent.com/u/30563561?v=4?s=100" width="100px;" alt="Stu Finn"/><br /><sub><b>Stu Finn</b></sub></a><br /><a href="https://github.com/hotosm/tasking-manager/commits?author=stufinn" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/marlenealv"><img src="https://avatars.githubusercontent.com/u/43651843?v=4?s=100" width="100px;" alt="marlenealv"/><br /><sub><b>marlenealv</b></sub></a><br /><a href="https://github.com/hotosm/tasking-manager/commits?author=marlenealv" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/shloakk"><img src="https://avatars.githubusercontent.com/u/31565271?v=4?s=100" width="100px;" alt="Shloak Aggarwal"/><br /><sub><b>Shloak Aggarwal</b></sub></a><br /><a href="https://github.com/hotosm/tasking-manager/commits?author=shloakk" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/visse0001"><img src="https://avatars.githubusercontent.com/u/44257228?v=4?s=100" width="100px;" alt="Sandra Kuczynska"/><br /><sub><b>Sandra Kuczynska</b></sub></a><br /><a href="https://github.com/hotosm/tasking-manager/commits?author=visse0001" title="Code">💻</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/Pete-Fowler"><img src="https://avatars.githubusercontent.com/u/104571660?v=4?s=100" width="100px;" alt="Pete Fowler"/><br /><sub><b>Pete Fowler</b></sub></a><br /><a href="https://github.com/hotosm/tasking-manager/commits?author=Pete-Fowler" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/noemitangles-prog"><img src="https://avatars.githubusercontent.com/u/242660864?v=4?s=100" width="100px;" alt="noemitangles-prog"/><br /><sub><b>noemitangles-prog</b></sub></a><br /><a href="https://github.com/hotosm/tasking-manager/commits?author=noemitangles-prog" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/nicokant"><img src="https://avatars.githubusercontent.com/u/6927678?v=4?s=100" width="100px;" alt="Niccolò Cantù"/><br /><sub><b>Niccolò Cantù</b></sub></a><br /><a href="https://github.com/hotosm/tasking-manager/commits?author=nicokant" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/NeolithEra"><img src="https://avatars.githubusercontent.com/u/52778917?v=4?s=100" width="100px;" alt="watchman-pypi"/><br /><sub><b>watchman-pypi</b></sub></a><br /><a href="https://github.com/hotosm/tasking-manager/commits?author=NeolithEra" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/michael63-osm"><img src="https://avatars.githubusercontent.com/u/10159463?v=4?s=100" width="100px;" alt="Michael Heißmeier"/><br /><sub><b>Michael Heißmeier</b></sub></a><br /><a href="https://github.com/hotosm/tasking-manager/commits?author=michael63-osm" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/matthewmodarres"><img src="https://avatars.githubusercontent.com/u/53260852?v=4?s=100" width="100px;" alt="matthewmodarres"/><br /><sub><b>matthewmodarres</b></sub></a><br /><a href="https://github.com/hotosm/tasking-manager/commits?author=matthewmodarres" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/LittleStar21"><img src="https://avatars.githubusercontent.com/u/48920862?v=4?s=100" width="100px;" alt="Leonard Ian (楊聰恩)"/><br /><sub><b>Leonard Ian (楊聰恩)</b></sub></a><br /><a href="https://github.com/hotosm/tasking-manager/commits?author=LittleStar21" title="Code">💻</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/jbronn"><img src="https://avatars.githubusercontent.com/u/141748?v=4?s=100" width="100px;" alt="Justin Bronn"/><br /><sub><b>Justin Bronn</b></sub></a><br /><a href="https://github.com/hotosm/tasking-manager/commits?author=jbronn" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/jonyeezs"><img src="https://avatars.githubusercontent.com/u/10862726?v=4?s=100" width="100px;" alt="Jonathan Yee"/><br /><sub><b>Jonathan Yee</b></sub></a><br /><a href="https://github.com/hotosm/tasking-manager/commits?author=jonyeezs" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/johantiden"><img src="https://avatars.githubusercontent.com/u/22770524?v=4?s=100" width="100px;" alt="Johan Tidén"/><br /><sub><b>Johan Tidén</b></sub></a><br /><a href="https://github.com/hotosm/tasking-manager/commits?author=johantiden" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/joelvzach"><img src="https://avatars.githubusercontent.com/u/22740733?v=4?s=100" width="100px;" alt="Joel V Zachariah"/><br /><sub><b>Joel V Zachariah</b></sub></a><br /><a href="https://github.com/hotosm/tasking-manager/commits?author=joelvzach" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/twpol"><img src="https://avatars.githubusercontent.com/u/1017843?v=4?s=100" width="100px;" alt="James Ross"/><br /><sub><b>James Ross</b></sub></a><br /><a href="https://github.com/hotosm/tasking-manager/commits?author=twpol" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/jake-low"><img src="https://avatars.githubusercontent.com/u/5893857?v=4?s=100" width="100px;" alt="Jake Low"/><br /><sub><b>Jake Low</b></sub></a><br /><a href="https://github.com/hotosm/tasking-manager/commits?author=jake-low" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/hugovk"><img src="https://avatars.githubusercontent.com/u/1324225?v=4?s=100" width="100px;" alt="Hugo van Kemenade"/><br /><sub><b>Hugo van Kemenade</b></sub></a><br /><a href="https://github.com/hotosm/tasking-manager/commits?author=hugovk" title="Code">💻</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/ernoma"><img src="https://avatars.githubusercontent.com/u/4325418?v=4?s=100" width="100px;" alt="Erno Mäkinen"/><br /><sub><b>Erno Mäkinen</b></sub></a><br /><a href="https://github.com/hotosm/tasking-manager/commits?author=ernoma" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/depth221"><img src="https://avatars.githubusercontent.com/u/22697167?v=4?s=100" width="100px;" alt="Dongha Hwang"/><br /><sub><b>Dongha Hwang</b></sub></a><br /><a href="https://github.com/hotosm/tasking-manager/commits?author=depth221" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/cquest"><img src="https://avatars.githubusercontent.com/u/1202668?v=4?s=100" width="100px;" alt="Christian Quest"/><br /><sub><b>Christian Quest</b></sub></a><br /><a href="https://github.com/hotosm/tasking-manager/commits?author=cquest" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/brownben"><img src="https://avatars.githubusercontent.com/u/9870007?v=4?s=100" width="100px;" alt="Ben Brown"/><br /><sub><b>Ben Brown</b></sub></a><br /><a href="https://github.com/hotosm/tasking-manager/commits?author=brownben" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/astros-dev"><img src="https://avatars.githubusercontent.com/u/91331418?v=4?s=100" width="100px;" alt="Astro Shah"/><br /><sub><b>Astro Shah</b></sub></a><br /><a href="https://github.com/hotosm/tasking-manager/commits?author=astros-dev" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/AndreasHae"><img src="https://avatars.githubusercontent.com/u/14837928?v=4?s=100" width="100px;" alt="Andreas Haessler"/><br /><sub><b>Andreas Haessler</b></sub></a><br /><a href="https://github.com/hotosm/tasking-manager/commits?author=AndreasHae" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/felskia"><img src="https://avatars.githubusercontent.com/u/5421566?v=4?s=100" width="100px;" alt="Ali Felski"/><br /><sub><b>Ali Felski</b></sub></a><br /><a href="https://github.com/hotosm/tasking-manager/commits?author=felskia" title="Code">💻</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/Akshit312"><img src="https://avatars.githubusercontent.com/u/29043437?v=4?s=100" width="100px;" alt="Akshit Agarwal"/><br /><sub><b>Akshit Agarwal</b></sub></a><br /><a href="https://github.com/hotosm/tasking-manager/commits?author=Akshit312" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/akshayrpatel"><img src="https://avatars.githubusercontent.com/u/17224083?v=4?s=100" width="100px;" alt="Akshay Patel"/><br /><sub><b>Akshay Patel</b></sub></a><br /><a href="https://github.com/hotosm/tasking-manager/commits?author=akshayrpatel" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/AfiMaameDufie"><img src="https://avatars.githubusercontent.com/u/38146824?v=4?s=100" width="100px;" alt="Abigail Afi Gbadago"/><br /><sub><b>Abigail Afi Gbadago</b></sub></a><br /><a href="https://github.com/hotosm/tasking-manager/commits?author=AfiMaameDufie" title="Code">💻</a></td>
    </tr>
  </tbody>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!

## Developers

* [Understand the code](./docs/developers/understanding-the-code.md)
* [Setup the TM for development](./docs/developers/development-setup.md)
* [Learn about versions and releases](./docs/developers/versions-and-releases.md)
* Help us and submit [pull requests](https://github.com/hotosm/tasking-manager/pulls)

## Instances
* [HOT Tasking Manager (production)](https://tasks.hotosm.org)
* [HOT Tasking Manager (staging)](https://tasks-stage.hotosm.org)
* [TeachOSM](https://tasks.teachosm.org/)
* [OpenStreetMap Indonesia](https://tasks-indonesia.hotosm.org/)
* [OpenStreetMap US](https://tasks.openstreetmap.us/)
* [Map My Kerala](https://mapmykerala.in/)
* [OpenHistoricalMap](https://tasks.openhistoricalmap.org)
* [Oceania Tasking Manager](https://tasks.smartcitiestransport.com/)
