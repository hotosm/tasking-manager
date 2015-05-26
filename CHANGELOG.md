OSM Tasking Manager Changelog
=============================

See https://github.com/hotosm/osm-tasking-manager2/releases

## 2.4.2 (2014-08-08)

 * More or less important bugs fixed

## 2.4.1 (2014-08-07)

 * Reverted a patch which was inserting wrong record in lock table

## 2.4.0 (2014-08-06)

 * Languages added: Lithuanian, Indonesian
 * Layout issues fixed
 * Difficulty can be set for each task
 * Priority areas can be defined for a project
 * Users are informed when a task they worked on is invalidated
 * Project tasks can be exported to GeoJSON
 * Performance enhancements

## 2.3.1 (2014-07-24)

 * Fixed bug with Potlatch2 not launching.
 * Fixed issue with static resources being cached by browser.

## 2.3.0 (2014-07-24)

 * Project creation workflow is made easier. KML can also be used as source.
 * Projects list can be filtered to show only user's projects
 * Projects can have a limited validity and be automatically archived after a
 given date.
 * Stats tab layout has been redesigned.
 * Project managers can now assign tasks to contributors.
 * Fixed issue with automatic unlock.
 * A link to overpass turbo were added to user profile page.
 * Transifex is now used for translations.
 * More languages were added. We now support de, es, fr, ja, pt, zw_TW.
 * Fixed a bunch of more or less blocker bugs.

## 2.2 (2014-07-17)

 * Task can be downloaded as .osm. Loads directly in JOSM.
 * Scaleline on map
 * Auto recenter and zoom on task
 * Added a project manager role
 * Fixed concurrency issues when modifying a task state
 * DB schema cleanup
 * Several UI enhancements for the project creation
 * HTML is no longer allowed in markdown fields

## 2.1.1 (2014-05-09)

* Layout enhancements in translations management in project edit page
* iD users are asked to accept the license

## 2.1 (2014-05-02)

Initial Tasking Manager V2 release.
