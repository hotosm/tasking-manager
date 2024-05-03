# Tasking Manager Database Schema

The TM database schema has evolved over the years. It is currently
implemented using sqlalchmey for the backend.

## Misc Tables

* alembic_version - The version of alembic used
* banner - A list of banners, which doesn't appear to be used anywhere
* priority_areas - A list of geometries for priority areas
* release_version - The version of the TM release
* spatial_ref_sys - Postgis support

## Prepopulated Tables

These tables contain data used by the frontend mostly. These could
have been an Enum, but a tables can be updated by the front end,
whereas an Enum can't. It does seem entirely possible these could be
extended by a project manager, for example, adding a new license.

* interests - General mapper interests
* licenses - Data licenses
* mapping_issue_categories - Issues with the map data
* application_keys - Application keys for remote data. This appears to
  not be used.

## Campaign Tables

The campaigns table is for mapping campaigns. A single campaign can
involve multiple organizations and TM projects.

* campaigns - Primary table
* campaign_organisations - Utility table to relate organizations with
  a campaign
* campaign_projects - Utility table to relate projects with a campaign

## Organization Tables

This is for an Organization profile.

* organisations - Primary table
* organisation_managers - Utility table to relate managers with an organization

## Project Tables

A project is the area to be mapped for the campaign. Each project
contains members and teams, which are stored in other tables.

* projects - Primary table
* project_allowed_users - Utility table to relate users to projects
* project_custom_editors - Utility table to store custom mapping
  editors, currently only used by RapidID
* project_favorites - Utility table to store favorite projects for a user
* project_info - Details on the project, like the description & instructions
* project_interests - Utility table to relate projects to interest categories
* project_priority_areas - Utility table to relate priority areas to projects
* project_teams - Utility table to relate team roles to projects
* project_chat - Support commenting for a project

## Messages Table

Support messaging between users.

* messages - Primary table

## Task Tables

A task is the area for a mapper to map. Task management is obviously a
key function of the Tasking Manager.

* tasks - Primary table
* task_annotations - Utility table for something, it appears to be
  unused anywhere
* task_history - Table for task history
* task_invalidation_history - Table for task invalidation history
* task_mapping_issues - Table for issues with a task

### Task History Table

This table is used to track the state changes for a task, not
including a task being invalidated. It contains a description of the
status change, when it changed, and the user ID when the task is
locked for mapping. A single task for a project may go through several
state changes during it's lifespan.

### Task Invalidation History Table

This table is used to track tasks that are invalidated. Unlike simple
state changes in the task history table, this tracks which validator
invalidated the task, when it was invalidated, and when the issue is
resolved.

### Task Mapping Issues

TBD

## Team Tables

This is for OSM Team support.

* teams - Primary table
* team_members - Utility table for team member profiles

## User Tables

* users - Primary table
* user_interests - Utility table to relate interests for a user
* user_licenses - Utility table to relate the data license to user
* users_with_email - Utility table of user email addresses, which
  appears to be unused

## Notification Table

This is a simple system for notifications.

* notifications - Primary table
