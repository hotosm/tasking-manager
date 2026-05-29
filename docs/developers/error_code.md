# Códigos de Error de la API del Tasking Manager

En este documento puedes encontrar descripciones detalladas de los códigos de error que se podria encontrar al utilizar los diferentes puntos de enlace (endpoints) de la API del Tasking Manager.

## Mensajes y Códigos de Error
Cuando la API del TM devuelve mensajes de error, lo hace en formato JSON. Por ejemplo, un error podría verse así:

```js
{"error":"Task in invalid state for mapping","SubCode": "InvalidTaskState"}

```

### Códigos de Error

Además del texto descriptivo del error, los mensajes de error también contienen SubCodes (subcódigos). Mientras que el **texto de un mensaje de error puede cambiar, el SubCode se mantendrá igual**.

| Código | Subcode | Texto |
| --- | --- | --- |
| 401 | InvalidToken | El token ha expirado o no es válido |
| 403 | AlreadyFeatured | El proyecto ya es destacado |
| 403 | CannotValidateMappedTask | Las tareas no pueden ser validadas por el mismo usuario que las marcó como mapeadas o con mala imagen |
| 500 | InternalServerError | Error interno del servidor |
| 400 | InvalidData | Error al validar la solicitud |
| 400 | InvalidDateRange | El rango de fechas no puede ser superior a 1 año |
| 400 | InvalidMultipolygon | Área de interés: MultiPolygon no válido |
| 403 | InvalidNewOwner | El nuevo propietario debe ser el gestor de la organización del proyecto o un administrador del TM |
| 400 | InvalidStartDate | La fecha de inicio debe ser anterior a la fecha de finalización |
| 403 | InvalidTaskState | Tarea en estado no válido para mapeo |
| 403 | InvalidUnlockState | Solo se puede establecer el estado a MAPPED, BADIMAGERY o READY después del mapeo |
| 403 | LockBeforeUnlocking | El estado debe ser LOCKED_FOR_MAPPING para desbloquear |
| 403 | LockToSplit | El estado debe ser LOCKED_FOR_MAPPING para dividir |
| 400 | MissingDate | Falta el parámetro de fecha de inicio |
| 400 | MustBeMultiPloygon | La geometría debe ser un MultiPolygon |
| 400 | MustHaveFeatures | El GeoJSON no contiene ninguna característica (features) |
| 403 | NotFeatured | El proyecto no es destacado |
| 404 | NotFound | No encontrado |
| 403 | NotLockedForValidation | La tarea no está en estado LOCKED_FOR_VALIDATION |
| 403 | NotReadyForValidation | La tarea no está como MAPPED, BADIMAGERY o INVALIDATED |
| 403 | OnlyAdminAccess | Esta acción del endpoint está restringida a usuarios ADMIN |
| 403 | ProjectNotPublished | Mapeo no permitido: El proyecto no está publicado |
| 403 | SmallToSplit | La tarea es demasiado pequeña para ser dividida |
| 403 | SplitGeoJsonError | La nueva tarea dividida no intersecta con la tarea original |
| 403 | SplitOtherUserTask | Intento de dividir una tarea que pertenece a otro usuario |
| 403 | TaskNotOwned | Intento de desbloquear una tarea que pertenece a otro usuario |
| 403 | UndoPermissionError | Deshacer no permitido para este usuario |
| 403 | UserAlreadyHasTaskLocked | Mapeo no permitido: El usuario ya tiene una tarea bloqueada |
| 409 | UserLicenseError | El usuario no ha aceptado los términos de la licencia |
| 403 | UserNotAllowed | Mapeo no permitido: El usuario no está en la lista de permitidos |
| 403 | UserNotPermitted | Acción de usuario no permitida |
| 403 | UserPermissionError | El usuario no es gestor del proyecto |
| 403 | PrivateProject | Usuario no permitido: Proyecto privado |
| 403 | ProjectNotFetched | No se pudo obtener el proyecto |
| 403 | NotPermittedToCreate | El usuario no tiene permiso para crear el proyecto |
| 400 | MustBeFeatureCollection | El GeoJSON debe ser una FeatureCollection |
| 400 | InvalidFeatureCollection | GeoJSON no válido: FeatureCollection no válida |
| 400 | MustBeFeature | El GeoJSON no válido debe ser una feature |
| 400 | InvalidMultiPolygon | GeoJSON no válido: FeatureCollection no válida |
| 400 | PropertyNotFound | No se encontró la propiedad esperada |
| 403 | InfoForLocaleRequired | No se proporcionó la información del proyecto para la configuración regional por defecto |
| 403 | MissingRequiredAttribute | Falta un atributo requerido |
| 403 | RequireLicenseId | No se encontró el LicenseId |
| 403 | HasMappedTasks | El proyecto tiene tareas mapeadas, no se puede eliminar |
| 403 | DeletePermissionError | El usuario no tiene permisos para eliminar el proyecto |
| 403 | BBoxTooBigError | El cuadro delimitador (bounding box) solicitado es demasiado grande |
| 403 | UserAlreadyInList | El usuario ya es miembro de este equipo o ya ha solicitado unirse |
| 403 | UserJoinDisallowed | El usuario no tiene permitido unirse al equipo |
| 403 | ApproveJoinError | No tienes permisos para aprobar esta solicitud de unión al equipo |
| 403 | RemoveUserError | No tienes permisos para eliminar de este equipo |
| 400 | EmptyMessage | No se permiten mensajes vacíos |
| 401 | UserNotTeamManager | El usuario no es administrador ni gestor del equipo |
| 403 | CreateTeamNotPermitted | El usuario no tiene permitido crear un equipo para la organización |
| 401 | UnableToAuth | No se pudo autenticar |
| 400 | UnknownUserRole | Rol desconocido. Los valores aceptados son BEGINNER, INTERMEDIATE, ADVANCED |
| 403 | UnknownAddRole | Rol desconocido. Los valores aceptados son ADMIN, PROJECT_MANAGER, VALIDATOR |
| 403 | NeedAdminRole | Debes ser administrador para asignar el rol de administrador |
| 400 | DateRangeGreaterThan3 | El rango de fechas no puede ser superior a 3 años |
| 400 | MissingDate | Falta el parámetro de fecha de inicio |
| 403 | AuthError | No se pudo autenticar |
| 400 | UnsupportedFile | El tipo MIME no está permitido. Los formatos soportados son: png, jpeg, webp y gif |
| 400 | MissingFilename | Falta el parámetro del nombre de archivo |
| 500 | UndefinedImageService | Servicio de subida de imágenes no definido |
| 409 | NameExists | El nombre ya existe |
| 409 | NullName | El nombre no puede ser nulo |
| 403 | ReadOnly | El usuario está en modo de solo lectura |
| 403 | AccessOtherUserMessage | El usuario intenta acceder al mensaje de otro usuario |
| 403 | CampaignAlreadyAssigned | La campaña ya está asignada a la organización |
| 403 | UserNotOrgAdmin | El usuario no es administrador de la organización |
| 403 | OrgHasProjects | La organización tiene algunos proyectos |
| 403 | MustHaveAdmin | Debe tener al menos un administrador |
| 403 | LoginToFilterManager | Filtrar por manager_user_id no está permitido para solicitudes no autenticadas |
| 400 | SelfIntersectingAOI | Geometría no válida. El polígono se auto-intersecta |
| 400 | TransferPermissionError | La transferencia de propiedad del proyecto solo está permitida para Admin de TM, administrador de la organización y el autor del proyecto |

```

By the way, to unlock the full functionality of all Apps, enable [Gemini Apps Activity](https://myactivity.google.com/product/gemini).

```