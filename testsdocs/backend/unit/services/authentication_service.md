# 1. Plan de Pruebas Unitarias: Authentication Service

El archivo `test_authentication_service.py` concentra las pruebas unitarias orientadas a validar el comportamiento del servicio de autenticación (`AuthenticationService`). El propósito fundamental de esta suite es garantizar la correcta generación, validación e integridad de los tokens de sesión y verificación utilizados por el sistema, así como asegurar la consistencia de los flujos asociados a autenticación y validación de correo electrónico.

Estas pruebas verifican que los mecanismos de autenticación operen de manera predecible frente a tokens válidos e inválidos, preservando la seguridad de los procesos de identificación de usuarios y mitigando riesgos asociados a manipulación de sesiones o validaciones incorrectas.

## 1.1. Relación con la lógica de negocio

Dentro de la lógica de negocio, estas pruebas aseguran la integridad y confiabilidad de los mecanismos de autenticación utilizados por la plataforma.

> [!IMPORTANT]
> El sistema debe garantizar que únicamente los tokens generados legítimamente por la plataforma puedan ser aceptados como válidos durante los procesos de autenticación y validación de identidad.

La lógica validada establece que los tokens de sesión deben mantener consistencia criptográfica, permitiendo asociar correctamente la identidad del usuario autenticado con la información contenida en el token generado. Asimismo, se verifica que cualquier alteración o manipulación sobre el contenido del token provoque inmediatamente su invalidación, evitando accesos no autorizados o falsificación de sesiones.

De igual manera, la suite valida el correcto funcionamiento de los flujos de verificación de correo electrónico, asegurando que las URLs generadas para validación contengan información íntegra y verificable antes de permitir la confirmación de identidad del usuario.

A través de estos tests, el proyecto mitiga riesgos funcionales y de seguridad críticos. Entre los principales riesgos prevenidos destacan:

- falsificación de tokens de autenticación,
- manipulación de sesiones activas,
- bypass de validación de correo electrónico,
- acceso indebido mediante credenciales alteradas,
- aceptación de firmas criptográficas inválidas.

Adicionalmente, la suite garantiza que los mecanismos de validación respondan de manera controlada frente a tokens corruptos o inválidos, evitando comportamientos inseguros o respuestas inconsistentes dentro del flujo de autenticación.

## 1.2. Técnica de implementación

Como observación técnica para la ejecución y mantenimiento de estos tests, destaca el enfoque desacoplado utilizado por la suite de autenticación. Las pruebas se ejecutan directamente sobre métodos pertenecientes al servicio `AuthenticationService`, permitiendo validar de manera aislada la lógica de generación y validación de tokens sin necesidad de interacción con persistencia en base de datos o componentes externos complejos.

Entre las principales técnicas implementadas destacan:

* Uso de herencia desde `BaseTestCase` para mantener consistencia en el entorno de pruebas.
* Validación estructural de URLs mediante `urlparse`.
* Extracción y validación de parámetros de consulta utilizando `parse_qs`.
* Simulación controlada de corrupción de tokens para validar integridad criptográfica.
* Verificación de interoperabilidad entre `AuthenticationService` y `SMTPService`.
* Validación de respuestas esperadas frente a tokens inválidos o manipulados.

Asimismo, la suite implementa validaciones orientadas a garantizar que los mecanismos de autenticación respondan correctamente frente a entradas alteradas, preservando la integridad de los procesos de identificación y validación de identidad del usuario.

### Ejemplo técnico

```python
def test_is_valid_token_validates_user_token(self):
    # Arrange
    session_token = AuthenticationService.generate_session_token_for_user(12345678)
    invalid_session_token = session_token + "x"

    # Act
    is_valid_token, user_id = AuthenticationService.is_valid_token(
        session_token, 604800
    )
    is_invalid_token, _user_id = AuthenticationService.is_valid_token(
        invalid_session_token, 604800
    )

    # Assert
    self.assertEqual(user_id, 12345678)
    self.assertTrue(is_valid_token)
    self.assertFalse(is_invalid_token)
```
## 1.3. Casos de Prueba Implementados

La siguiente tabla mapea el comportamiento esperado y obtenido para cada escenario validado dentro de la suite de autenticación.

| ID del Caso     | Módulo                | Objetivo                                                                                 | Precondiciones                                                                     | Entrada                                                                | Resultado Esperado                                                                       | Resultado Obtenido                                                           | Estado   | Riesgo Asociado                                                                  |
| :-------------- | :-------------------- | :--------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------- | :--------------------------------------------------------------------- | :--------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------- | :------- | :------------------------------------------------------------------------------- |
| **TC-AUTH-001** | AuthenticationService | Validar la correcta generación de un token de sesión para un usuario válido.             | El servicio de autenticación debe encontrarse disponible.                          | ID de usuario válido (`12345678`).                                     | El sistema debe generar un token de sesión válido y no nulo.                             | Se genera correctamente un token de sesión.                                  | Aprobado | Generación incorrecta de sesiones autenticadas.                                  |
| **TC-AUTH-002** | AuthenticationService | Verificar la validación de integridad sobre tokens de autenticación válidos e inválidos. | Debe existir un token generado previamente por el sistema.                         | Token válido y token alterado manualmente.                             | El token legítimo debe validarse correctamente y el token manipulado debe ser rechazado. | El token válido es aceptado y el token alterado es invalidado correctamente. | Aprobado | Manipulación de sesiones y falsificación de tokens.                              |
| **TC-AUTH-003** | AuthenticationService | Validar la correcta generación de la URL de fallo de autenticación.                      | El servicio de autenticación debe encontrarse operativo.                           | Solicitud de URL de autenticación fallida.                             | La URL generada debe contener la ruta `/auth-failed`.                                    | La ruta generada coincide correctamente con `/auth-failed`.                  | Aprobado | Redirecciones incorrectas dentro del flujo de autenticación.                     |
| **TC-AUTH-004** | AuthenticationService | Verificar la generación correcta de la URL de validación de correo electrónico.          | El servicio de autenticación debe encontrarse operativo.                           | Solicitud de URL de validación de correo.                              | La URL generada debe contener la ruta `/validate-email`.                                 | La ruta generada coincide correctamente con `/validate-email`.               | Aprobado | Inconsistencias en los flujos de validación de identidad.                        |
| **TC-AUTH-005** | AuthenticationService | Validar el procesamiento y verificación de tokens de confirmación de correo electrónico. | Debe generarse previamente una URL firmada de verificación mediante `SMTPService`. | URL de verificación con token válido asociado a un correo electrónico. | El sistema debe validar el token y recuperar correctamente el correo asociado.           | El token es validado exitosamente y el correo es recuperado correctamente.   | Aprobado | Bypass de validación de correo electrónico y verificación insegura de identidad. |

