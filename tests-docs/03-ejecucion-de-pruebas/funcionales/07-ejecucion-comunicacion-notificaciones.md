# MOD-0007 - Comunicación y Notificaciones

### 7.1. Registrar comentario válido en una tarea

**CP-MOD7-001**

| ID              | Descripción                                                                                                 | Tipo   | Estado  | Defectos                    |
| :-------------- | :---------------------------------------------------------------------------------------------------------- | :----- | :------ | :-------------------------- |
| **CP-MOD7-001** | Verificar que el sistema permita registrar un comentario válido asociado a una tarea dentro de un proyecto. | Manual | Exitoso | No se encontraron defectos. |

| Resultado esperado                                                                                                                           | Resultado obtenido                                                                                                                  |
| :------------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------- |
| El sistema debe permitir ingresar un comentario de texto válido, guardarlo y mostrarlo en el historial o sección de comentarios de la tarea. | El sistema permitió ingresar el comentario, registrarlo correctamente y mostrarlo dentro de la sección correspondiente de la tarea. |

#### Evidencia CP-MOD7-001 — Área de comentarios de la tarea

<p align="center">
  <img src="/tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-0007-comunicacion-notificaciones/CP-MOD7-001-01-area-comentarios-tarea.png" alt="CP-MOD7-001 - Área de comentarios de la tarea" width="300">
</p>

Se observa la pantalla de la tarea donde el sistema permite registrar comentarios asociados al trabajo realizado sobre dicha tarea.

#### Evidencia CP-MOD7-001 — Comentario ingresado

<p align="center">
  <img src="/tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-0007-comunicacion-notificaciones/CP-MOD7-001-02-comentario-ingresado.png" alt="CP-MOD7-001 - Comentario ingresado" width="300">
</p>

Se observa que el usuario ingresó un comentario válido en el campo correspondiente antes de enviarlo.

#### Evidencia CP-MOD7-001 — Comentario registrado correctamente

<p align="center">
  <img src="/tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-0007-comunicacion-notificaciones/CP-MOD7-001-03-comentario-registrado.png" alt="CP-MOD7-001 - Comentario registrado correctamente" width="500">
</p>

Se evidencia que el sistema registró correctamente el comentario y lo mostró dentro del historial o sección de comentarios de la tarea.

### 7.2. Envío de tarea sin comentario obligatorio

**CP-MOD7-002**

| ID              | Descripción                                                                                                                                                | Tipo   | Estado  | Defectos                    |
| :-------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------- | :----- | :------ | :-------------------------- |
| **CP-MOD7-002** | Verificar el comportamiento del sistema al enviar una tarea sin registrar comentario, validando si el comentario es obligatorio dentro del flujo de envío. | Manual | Exitoso | No se encontraron defectos. |

| Resultado esperado                                                                                                                                                                       | Resultado obtenido                                                                                                                                                                       |
| :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| El sistema debe permitir enviar la tarea sin comentario si el comentario no es obligatorio, siempre que se complete la condición requerida sobre si la tarea está completamente mapeada. | El sistema permitió enviar la tarea sin comentario después de seleccionar la opción obligatoria sobre el estado de mapeo de la tarea, y redirigió correctamente a la vista del proyecto. |

#### Evidencia CP-MOD7-002 — Comentario vacío sin opción de mapeo seleccionada

<p align="center">
  <img src="/tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-0007-comunicacion-notificaciones/CP-MOD7-002-01-comentario-vacio-sin-opcion-mapeo.png" alt="CP-MOD7-002 - Comentario vacío sin opción de mapeo seleccionada" width="300">
</p>

Se observa que el campo de comentario se encuentra vacío y que el sistema solicita responder si la tarea está completamente mapeada antes de permitir el envío.

#### Evidencia CP-MOD7-002 — Comentario vacío con opción de mapeo seleccionada

<p align="center">
  <img src="/tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-0007-comunicacion-notificaciones/CP-MOD7-002-02-comentario-vacio-con-opcion-mapeo.png" alt="CP-MOD7-002 - Comentario vacío con opción de mapeo seleccionada" width="300">
</p>

Se evidencia que, al seleccionar una opción para indicar si la tarea está completamente mapeada, el sistema permite continuar con el envío aun cuando el comentario permanece vacío.

#### Evidencia CP-MOD7-002 — Redirección a la vista del proyecto

<p align="center">
  <img src="/tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-0007-comunicacion-notificaciones/CP-MOD7-002-03-redireccion-vista-proyecto.png" alt="CP-MOD7-002 - Redirección a la vista del proyecto" width="650">
</p>

Se evidencia que el sistema procesó correctamente el envío de la tarea sin comentario obligatorio y redirigió al usuario a la vista del proyecto.

### 7.3. Registrar comentario con formato Markdown básico

**CP-MOD7-003**

| ID              | Descripción                                                                                               | Tipo   | Estado  | Defectos                    |
| :-------------- | :-------------------------------------------------------------------------------------------------------- | :----- | :------ | :-------------------------- |
| **CP-MOD7-003** | Verificar que el sistema permita registrar un comentario con formato Markdown básico dentro de una tarea. | Manual | Exitoso | No se encontraron defectos. |

| Resultado esperado                                                                                                                                                    | Resultado obtenido                                                                                                                                   |
| :-------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------- |
| El sistema debe permitir ingresar un comentario con formato Markdown básico, mostrar una vista previa comprensible y registrar el comentario sin afectar la interfaz. | El sistema permitió ingresar el comentario con formato Markdown, mostró correctamente la vista previa y registró el comentario sin errores visibles. |

#### Evidencia CP-MOD7-003 — Comentario Markdown ingresado

<p align="center">
  <img src="/tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-0007-comunicacion-notificaciones/CP-MOD7-003-01-comentario-markdown-ingresado.png" alt="CP-MOD7-003 - Comentario Markdown ingresado" width="350">
</p>

Se observa que el usuario ingresó un comentario con formato Markdown básico en el campo de comentarios de la tarea.

#### Evidencia CP-MOD7-003 — Vista previa del formato Markdown

<p align="center">
  <img src="/tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-0007-comunicacion-notificaciones/CP-MOD7-003-02-vista-previa-markdown.png" alt="CP-MOD7-003 - Vista previa Markdown" width="350">
</p>

Se evidencia que el sistema muestra una vista previa del contenido con formato Markdown, permitiendo verificar cómo se visualizará el comentario antes de enviarlo.

#### Evidencia CP-MOD7-003 — Comentario Markdown registrado correctamente

<p align="center">
  <img src="/tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-0007-comunicacion-notificaciones/CP-MOD7-003-03-comentario-markdown-registrado.png" alt="CP-MOD7-003 - Comentario Markdown registrado" width="300">
</p>

Se evidencia que el sistema registró correctamente el comentario con formato Markdown y lo mostró en la sección correspondiente de la tarea sin afectar la interfaz.

### 7.4. Registrar comentario mencionando a un usuario existente

**CP-MOD7-004**

| ID              | Descripción                                                                                                                  | Tipo   | Estado                  | Defectos                    |
| :-------------- | :--------------------------------------------------------------------------------------------------------------------------- | :----- | :---------------------- | :-------------------------- |
| **CP-MOD7-004** | Verificar que el sistema permita registrar un comentario que incluya una mención a un usuario existente mediante `@usuario`. | Manual | Exitoso con observación | No se encontraron defectos. |

| Resultado esperado                                                                                                                                                                                                             | Resultado obtenido                                                                                                                                                                                                       |
| :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| El sistema debe permitir ingresar y registrar un comentario con mención a un usuario existente. Si las notificaciones internas se encuentran habilitadas, el sistema debe generar una notificación para el usuario mencionado. | El sistema permitió ingresar, previsualizar y registrar correctamente el comentario con mención a un usuario existente. Sin embargo, durante la ejecución no se evidenció una notificación in-app asociada a la mención. |

#### Evidencia CP-MOD7-004 — Comentario con mención ingresado

<p align="center">
  <img src="/tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-0007-comunicacion-notificaciones/CP-MOD7-004-01-comentario-con-mencion-ingresado.png" alt="CP-MOD7-004 - Comentario con mención ingresado" width="350">
</p>

Se observa que el usuario ingresó un comentario que incluye una mención a un usuario existente mediante el formato `@usuario`.

#### Evidencia CP-MOD7-004 — Vista previa de la mención

<p align="center">
  <img src="/tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-0007-comunicacion-notificaciones/CP-MOD7-004-02-vista-previa-mencion.png" alt="CP-MOD7-004 - Vista previa de la mención" width="300">
</p>

Se evidencia que el sistema permite visualizar el comentario con la mención antes de enviarlo, sin afectar la interfaz.

#### Evidencia CP-MOD7-004 — Comentario con mención registrado correctamente

<p align="center">
  <img src="/tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-0007-comunicacion-notificaciones/CP-MOD7-004-03-comentario-con-mencion-registrado.png" alt="CP-MOD7-004 - Comentario con mención registrado" width="300">
</p>

Se evidencia que el sistema registró correctamente el comentario con mención dentro de la tarea.

### 7.5. Registrar comentario con mención inexistente

**CP-MOD7-005**

| ID              | Descripción                                                                                                           | Tipo   | Estado  | Defectos                    |
| :-------------- | :-------------------------------------------------------------------------------------------------------------------- | :----- | :------ | :-------------------------- |
| **CP-MOD7-005** | Verificar el comportamiento del sistema al registrar un comentario que contiene una mención a un usuario inexistente. | Manual | Exitoso | No se encontraron defectos. |

| Resultado esperado                                                                                                                                                 | Resultado obtenido                                                                                                                                         |
| :----------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------- |
| El sistema debe permitir registrar el comentario sin romper la interfaz. La mención inexistente no debe resolverse como enlace ni generar una notificación válida. | El sistema permitió registrar el comentario correctamente. La mención inexistente se mostró como texto plano y no se evidenció generación de notificación. |

#### Evidencia CP-MOD7-005 — Mención inexistente ingresada

<p align="center">
  <img src="/tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-0007-comunicacion-notificaciones/CP-MOD7-005-01-mencion-inexistente-ingresada.png" alt="CP-MOD7-005 - Mención inexistente ingresada" width="350">
</p>

Se observa que el usuario ingresó un comentario que incluye una mención a un usuario inexistente.

#### Evidencia CP-MOD7-005 — Vista previa de mención inexistente

<p align="center">
  <img src="/tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-0007-comunicacion-notificaciones/CP-MOD7-005-02-vista-previa-mencion-inexistente.png" alt="CP-MOD7-005 - Vista previa de mención inexistente" width="350">
</p>

Se evidencia que el sistema permite previsualizar el comentario sin romper la interfaz, aun cuando la mención no corresponde a un usuario existente.

#### Evidencia CP-MOD7-005 — Comentario con mención inexistente registrado

<p align="center">
  <img src="/tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-0007-comunicacion-notificaciones/CP-MOD7-005-03-comentario-mencion-inexistente-registrado.png" alt="CP-MOD7-005 - Comentario con mención inexistente registrado" width="350">
</p>

Se evidencia que el sistema registró correctamente el comentario. La mención inexistente se mostró como texto plano, por lo que no fue resuelta como enlace ni como referencia válida a un usuario del sistema.

### 7.6. Verificación de notificación in-app por mención

**CP-MOD7-006**

| ID              | Descripción                                                                                                         | Tipo   | Estado                    | Defectos                          |
| :-------------- | :------------------------------------------------------------------------------------------------------------------ | :----- | :------------------------ | :-------------------------------- |
| **CP-MOD7-006** | Verificar si el sistema muestra una notificación interna cuando un usuario es mencionado en un comentario de tarea. | Manual | Ejecutado con observación | No se confirmó defecto funcional. |

| Resultado esperado                                                                                                                                                                                          | Resultado obtenido                                                                                                                                                      |
| :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| El sistema debe mostrar una notificación in-app para el usuario mencionado cuando se registra un comentario con una mención válida, siempre que las notificaciones se encuentren habilitadas en el entorno. | Se revisó el área de notificaciones después de registrar una mención válida, pero no se evidenció una notificación visible asociada a la mención dentro de la interfaz. |

#### Evidencia CP-MOD7-006 — Panel de notificaciones revisado

<p align="center">
  <img src="/tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-0007-comunicacion-notificaciones/CP-MOD7-006-01-panel-notificaciones-revisado.png" alt="CP-MOD7-006 - Panel de notificaciones revisado" width="300">
</p>

Se observa el área de notificaciones del sistema revisada después de haber registrado previamente un comentario con mención a un usuario existente.

#### Evidencia CP-MOD7-006 — Mención no visible en notificaciones

<p align="center">
  <img src="/tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-0007-comunicacion-notificaciones/CP-MOD7-006-02-mencion-no-visible-en-notificaciones.png" alt="CP-MOD7-006 - Mención no visible en notificaciones" width="400">
</p>

Se evidencia que la mención registrada en el comentario no aparece como notificación visible en el panel de notificaciones durante la ejecución realizada.

#### Observación de ejecución

Durante la prueba se verificó que la mención a un usuario existente fue registrada correctamente en el comentario de la tarea; sin embargo, no se evidenció una notificación in-app asociada a dicha mención. Este comportamiento queda registrado como observación, ya que puede depender de la configuración de notificaciones, preferencias del usuario, sesión del destinatario o condiciones propias del entorno local de pruebas.

### 7.7. Verificar acceso al panel de notificaciones

**CP-MOD7-007**

| ID              | Descripción                                                                                                    | Tipo   | Estado  | Defectos                    |
| :-------------- | :------------------------------------------------------------------------------------------------------------- | :----- | :------ | :-------------------------- |
| **CP-MOD7-007** | Verificar que el usuario pueda acceder al panel de notificaciones y que este cargue correctamente sin errores. | Manual | Exitoso | No se encontraron defectos. |

| Resultado esperado                                                                                                                                                 | Resultado obtenido                                                                                                                                       |
| :----------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------- |
| El sistema debe permitir acceder al área de notificaciones y mostrar el panel correspondiente sin errores, independientemente de si existen notificaciones nuevas. | El sistema permitió acceder correctamente al panel de notificaciones. El panel cargó sin errores visibles, aunque no se mostraron notificaciones nuevas. |

#### Evidencia CP-MOD7-007 — Acceso al panel de notificaciones

<p align="center">
  <img src="/tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-0007-comunicacion-notificaciones/CP-MOD7-007-01-acceso-panel-notificaciones.png" alt="CP-MOD7-007 - Acceso al panel de notificaciones" width="350">
</p>

Se observa que el usuario accede al área o panel de notificaciones desde la interfaz del sistema.

#### Evidencia CP-MOD7-007 — Panel de notificaciones cargado correctamente

<p align="center">
  <img src="/tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-0007-comunicacion-notificaciones/CP-MOD7-007-02-panel-notificaciones-cargado.png" alt="CP-MOD7-007 - Panel de notificaciones cargado correctamente" width="350">
</p>

Se evidencia que el panel de notificaciones carga correctamente y no presenta errores técnicos visibles durante la consulta.

### 7.8. Reenvío de correo de validación desde el perfil de usuario

**CP-MOD7-008**

| ID              | Descripción                                                                                                                      | Tipo   | Estado                    | Defectos                          |
| :-------------- | :------------------------------------------------------------------------------------------------------------------------------- | :----- | :------------------------ | :-------------------------------- |
| **CP-MOD7-008** | Verificar el comportamiento del sistema al solicitar el reenvío del correo electrónico de validación desde el perfil de usuario. | Manual | Ejecutado con observación | No se confirmó defecto funcional. |

| Resultado esperado                                                                                                                                                                                      | Resultado obtenido                                                                                                                                                                                            |
| :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| El sistema debe permitir solicitar el reenvío del correo de validación. Si el entorno de correo se encuentra correctamente configurado, el usuario debería recibir el mensaje en su bandeja de entrada. | El sistema mostró el correo electrónico del usuario e indicó que se debía revisar la cuenta para confirmar la dirección. Sin embargo, durante la ejecución no se recibió el correo en la bandeja del usuario. |

#### Evidencia CP-MOD7-008 — Correo electrónico pendiente de validación

<p align="center">
  <img src="/tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-0007-comunicacion-notificaciones/CP-MOD7-008-01-correo-electronico-pendiente-validacion.png" alt="CP-MOD7-008 - Correo electrónico pendiente de validación" width="400">
</p>

Se observa que el sistema muestra el correo electrónico asociado al usuario y solicita confirmar la dirección mediante un correo de validación.

#### Evidencia CP-MOD7-008 — Correo no recibido en bandeja del usuario

<p align="center">
  <img src="/tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-0007-comunicacion-notificaciones/CP-MOD7-008-02-correo-no-recibido.png" alt="CP-MOD7-008 - Correo no recibido" width="400">
</p>

Se evidencia que, durante la ejecución de la prueba, no se recibió el correo de validación en la bandeja del usuario.

#### Observación de ejecución

Durante la prueba se verificó que la interfaz informa al usuario que debe confirmar su correo electrónico. Sin embargo, no se pudo confirmar la recepción del mensaje en la bandeja de entrada. Este resultado queda registrado como observación, debido a que el envío real de correos puede depender de variables de entorno o servicios externos no habilitados en el entorno local de pruebas.

### 7.9. Registrar comentario usando etiquetas de grupo

**CP-MOD7-009**

| ID              | Descripción                                                                                                     | Tipo   | Estado  | Defectos                    |
| :-------------- | :-------------------------------------------------------------------------------------------------------------- | :----- | :------ | :-------------------------- |
| **CP-MOD7-009** | Verificar que el sistema permita registrar un comentario que incluya una etiqueta de grupo dentro de una tarea. | Manual | Exitoso | No se encontraron defectos. |

| Resultado esperado                                                                                                                                                  | Resultado obtenido                                                                                                                                   |
| :------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :--------------------------------------------------------------------------------------------------------------------------------------------------- |
| El sistema debe permitir ingresar un comentario con una etiqueta de grupo, registrarlo correctamente y mostrarlo en la sección de comentarios sin errores visibles. | El sistema permitió ingresar y registrar correctamente el comentario con etiqueta de grupo dentro de la tarea, sin presentar errores en la interfaz. |

#### Evidencia CP-MOD7-009 — Comentario con etiqueta de grupo ingresado

<p align="center">
  <img src="/tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-0007-comunicacion-notificaciones/CP-MOD7-009-01-comentario-con-etiqueta-grupo-ingresado.png" alt="CP-MOD7-009 - Comentario con etiqueta de grupo ingresado" width="400">
</p>

Se observa que el usuario ingresó un comentario utilizando una etiqueta de grupo disponible en el editor de comentarios.

#### Evidencia CP-MOD7-009 — Vista previa de etiqueta de grupo

<p align="center">
  <img src="/tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-0007-comunicacion-notificaciones/CP-MOD7-009-02-vista-previa-etiqueta-grupo.png" alt="CP-MOD7-009 - Vista previa de etiqueta de grupo" width="400">
</p>

Se evidencia que el sistema permite previsualizar el comentario con la etiqueta de grupo antes de enviarlo.

#### Evidencia CP-MOD7-009 — Comentario con etiqueta de grupo registrado correctamente

<p align="center">
  <img src="/tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-0007-comunicacion-notificaciones/CP-MOD7-009-03-comentario-etiqueta-grupo-registrado.png" alt="CP-MOD7-009 - Comentario con etiqueta de grupo registrado" width="400">
</p>

Se evidencia que el comentario con etiqueta de grupo fue registrado correctamente en la sección de comentarios de la tarea, sin errores visibles en la interfaz.

### 7.10. Registrar comentario extenso en una tarea

**CP-MOD7-010**

| ID              | Descripción                                                                                                   | Tipo   | Estado  | Defectos                    |
| :-------------- | :------------------------------------------------------------------------------------------------------------ | :----- | :------ | :-------------------------- |
| **CP-MOD7-010** | Verificar que el sistema permita registrar un comentario extenso dentro de una tarea sin afectar la interfaz. | Manual | Exitoso | No se encontraron defectos. |

| Resultado esperado                                                                                                                                                         | Resultado obtenido                                                                                                                              |
| :------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------- |
| El sistema debe permitir ingresar, previsualizar y registrar un comentario extenso dentro de una tarea, manteniendo la legibilidad del contenido y sin romper la interfaz. | El sistema permitió ingresar y registrar correctamente el comentario extenso dentro de la tarea, sin presentar errores visibles en la interfaz. |

#### Evidencia CP-MOD7-010 — Comentario extenso ingresado

<p align="center">
  <img src="/tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-0007-comunicacion-notificaciones/CP-MOD7-010-01-comentario-extenso-ingresado.png" alt="CP-MOD7-010 - Comentario extenso ingresado" width="400">
</p>

Se observa que el usuario ingresó un comentario extenso en el campo de comentarios de la tarea.

#### Evidencia CP-MOD7-010 — Vista previa del comentario extenso

<p align="center">
  <img src="/tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-0007-comunicacion-notificaciones/CP-MOD7-010-02-vista-previa-comentario-extenso.png" alt="CP-MOD7-010 - Vista previa comentario extenso" width="400">
</p>

Se evidencia que el sistema permite revisar la vista previa del comentario extenso antes de enviarlo, manteniendo una visualización comprensible del contenido.

#### Evidencia CP-MOD7-010 — Comentario extenso registrado correctamente

<p align="center">
  <img src="/tests-docs/03-ejecucion-de-pruebas/funcionales/img/MOD-0007-comunicacion-notificaciones/CP-MOD7-010-03-comentario-extenso-registrado.png" alt="CP-MOD7-010 - Comentario extenso registrado" width="400">
</p>

Se evidencia que el sistema registró correctamente el comentario extenso dentro de la sección de comentarios de la tarea, sin errores visibles ni pérdida de contenido.
