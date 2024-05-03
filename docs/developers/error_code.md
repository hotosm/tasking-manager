# Tasking Manager API Error Codes

In this document you can find detailed descriptions of the error codes you might encounter when using the different endpoints of the Tasking Manager API.

## Error Messages and Codes
When the TM API returns error messages, it does so in JSON format. For example, an error might look like this:
```js
{"error":"Task in invalid state for mapping","SubCode": "InvalidTaskState"}
```

### Error Codes
In addition to descriptive error text, error messages also contains SubCodes. While the **text for an error message may change, the SubCode will stay the same**.

| Code | Subcode                  | Text                                                                               |
| ---- | ------------------------ | ---------------------------------------------------------------------------------- |
| 401  | InvalidToken             | Token is expired or invalid                                                        |
| 403  | AlreadyFeatured          | Project is already featured                                                        |
| 403  | CannotValidateMappedTask | Tasks cannot be validated by the same user who marked task as mapped or badimagery |
| 500  | InternalServerError      | Internal Server Error                                                              |
| 400  | InvalidData              | Error validating request                                                           |
| 400  | InvalidDateRange         | Date range can not be bigger than 1 year                                           |
| 400  | InvalidMultipolygon      | Area of Interest: Invalid MultiPolygon                                             |
| 403  | InvalidNewOwner          | New owner must be project's org manager or TM admin                                |
| 400  | InvalidStartDate         | Start date must be earlier than end date                                           |
| 403  | InvalidTaskState         | Task in invalid state for mapping                                                  |
| 403  | InvalidUnlockState       | Can only set status to MAPPED, BADIMAGERY, READY after mapping                     |
| 403  | LockBeforeUnlocking      | Status must be LOCKED\_FOR\_MAPPING to unlock                                      |
| 403  | LockToSplit              | Status must be LOCKED\_FOR\_MAPPING to split                                       |
| 400  | MissingDate              | Missing start date parameter                                                       |
| 400  | MustBeMultiPloygon       | Geometry must be a MultiPolygon                                                    |
| 400  | MustHaveFeatures         | Geojson does not contain any features                                              |
| 403  | NotFeatured              | Project is not featured                                                            |
| 404  | NotFound                 | Not Found                                                                          |
| 403  | NotLockedForValidation   | Task is not LOCKED\_FOR\_VALIDATION                                                |
| 403  | NotReadyForValidation    | Task is not MAPPED, BADIMAGERY or INVALIDATED                                      |
| 403  | OnlyAdminAccess          | This endpoint action is restricted to ADMIN users                                  |
| 403  | ProjectNotPublished      | Mapping not allowed because: Project not published                                 |
| 403  | SmallToSplit             | Task is too small to be split                                                      |
| 403  | SplitGeoJsonError        | New split task does not intersect original task                                    |
| 403  | SplitOtherUserTask       | Attempting to split a task owned by another user                                   |
| 403  | TaskNotOwned             | Attempting to unlock a task owned by another user                                  |
| 403  | UndoPermissionError      | Undo not allowed for this user                                                     |
| 403  | UserAlreadyHasTaskLocked | Mapping not allowed because: User already has task locked                          |
| 409  | UserLicenseError         | User not accepted license terms                                                    |
| 403  | UserNotAllowed           | Mapping not allowed because: User not on allowed list                              |
| 403  | UserNotPermitted         | User action not permitted                                                          |
| 403  | UserPermissionError      | User is not a manager of the project                                               |
| 403  | PrivateProject           | User not permitted: Private Project                                                |
| 403  | ProjectNotFetched        | Unable to fetch project                                                            |
| 403  | NotPermittedToCreate     | User is not permitted to create project                                            |
| 400  | MustBeFeatureCollection  | GeoJson must be FeatureCollection                                                  |
| 400  | InvalidFeatureCollection | Invalid GeoJson: Invalid feature collection                                        |
| 400  | MustBeFeature            | Invalid GeoJson should be a feature                                                |
| 400  | InvalidMultiPolygon      | Invalid GeoJson: Invalid feature collection                                        |
| 400  | PropertyNotFound         | Expected property not found                                                        |
| 403  | InfoForLocaleRequired    | Project Info for Default Locale not provided                                       |
| 403  | MissingRequiredAttribute | Missing required attribute                                                         |
| 403  | RequireLicenseId         | LicenseId not found                                                                |
| 403  | HasMappedTasks           | Project has mapped tasks, cannot be deleted                                        |
| 403  | DeletePermissionError    | User does not have permissions to delete project                                   |
| 403  | BBoxTooBigError          | Requested bounding box is too large                                                |
| 403  | UserAlreadyInList        | User is already a member of this team or has already requested to join             |
| 403  | UserJoinDisallowed       | User not allowed to join team                                                      |
| 403  | ApproveJoinError         | You don't have permissions to approve this join team request                       |
| 403  | RemoveUserError          | You don't have permissions to remove from this team.                               |
| 400  | EmptyMessage             | Empty message not allowed                                                          |
| 401  | UserNotTeamManager       | User is not a admin or a manager for the team                                      |
| 403  | CreateTeamNotPermitted   | User not permitted to create team for the Organisation                             |
| 401  | UnableToAuth             | Unable to authenticate                                                             |
| 400  | UnknownUserRole          | Unknown role accepted values are BEGINNER, INTERMEDIATE, ADVANCED                  |
| 403  | UnknownAddRole           | Unknown role accepted values are ADMIN, PROJECT\_MANAGER, VALIDATOR                |
| 403  | NeedAdminRole            | You must be an Admin to assign Admin role                                          |
| 400  | DateRangeGreaterThan3    | Date range can not be bigger than 3 years                                          |
| 400  | MissingDate              | Missing start date parameter                                                       |
| 403  | AuthError                | Unable to authenticate                                                             |
| 400  | UnsupportedFile          | Mimetype is not allowed. The supported formats are: png, jpeg, webp and gif.       |
| 400  | MissingFilename          | Missing filename parameter                                                         |
| 500  | UndefinedImageService    | Image upload service not defined                                                   |
| 409  | NameExists               | Name already exists                                                                |
| 409  | NullName                 | Name cannot be null                                                                |
| 403  | ReadOnly                 | User is on read only mode                                                          |
| 403  | AccessOtherUserMessage   | User attempting to access another users message                                    |
| 403  | CampaignAlreadyAssigned  | Campaign is already assigned to organization                                       |
| 403  | UserNotOrgAdmin          | User is not an admin for the org                                                   |
| 403  | OrgHasProjects           | Organization has some projects                                                     |
| 403  | MustHaveAdmin            | Must have at least one admin                                                       |
| 403  | LoginToFilterManager     | Filter by manager\_user\_id is not allowed to unauthenticated requests             |
| 400  | SelfIntersectingAOI      | Invalid geometry. Polygon is self-intersecting                                     |
| 400  | TransferPermissionError  | Project ownership transfer is only allowed to TM Admin, Organization admin and project author|
