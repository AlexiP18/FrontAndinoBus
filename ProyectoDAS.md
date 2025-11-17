# PROYECTO SEMESTRAL 

## Desarrollo Asistido por Software

## OBJETIVO

Aplicar los principios de la ingeniería asistida por software mediante el desarrollo de una solución web y móvil, integrando herramientas que mejoren la calidad del producto, la productividad del equipo y la colaboración durante todo el ciclo de vida del desarrollo.

## INDICACIONES GENERALES

- Cada grupo representará un equipo de desarrollo de software y deberá designar un líder de equipo, quien será el responsable de coordinar las actividades, organizar reuniones, dar seguimiento al avance y ser el punto de contacto con el docente.
- La asignación de tareas debe ser equitativa, garantizando que todos los miembros participen activamente en las distintas fases del proyecto (análisis, diseño, desarrollo, pruebas, documentación, etc.). Esta asignación debe registrarse y justificarse en los informes de avance.
- Se debe aplicar una metodología de desarrollo ágil, como Scrum, Kanban u otra que se adapte al contexto del equipo y al tipo de proyecto. Se deben evidenciar prácticas como la planificación de iteraciones, gestión de backlog, reuniones de seguimiento, etc.
- Es obligatorio el uso de herramientas de apoyo al desarrollo asistido por software, tales como:
- Herramientas de gestión de proyectos y tareas (Ej. Trello, Jira, GitHub Projects).
- Control de versiones (Ej. Git, GitHub, GitLab).
- Herramientas de colaboración y comunicación (Ej. Slack, Discord, Microsoft Teams).
- Herramientas para documentación (Ej. Notion, Confluence, Google Docs).
- Herramientas para pruebas y control de calidad (Ej. Postman, Selenium, SonarQube).
- El uso y correcta integración de estas herramientas será parte de la evaluación del proyecto. Además, se realizarán revisiones periódicas en clase para

verificar el avance del desarrollo, la participación individual y la aplicación efectiva de la metodología seleccionada.

# CASO PROPUESTO 

Desarrollo de una aplicación web y móvil para la gestión y venta de pasajes dirigida a usuarios de transporte interprovincial en Ecuador.

## REQUERIMIENTOS DEL SISTEMA

Los siguientes requerimientos deben ser considerados, además de los que se definan en las revisiones periódicas en clase:

## APLICACIÓN WEB (PLATAFORMA SAS):

- Administrar información mediante operaciones CRUD (cooperativas, frecuencias, buses, etc.).
- Implementar diferentes roles de usuario de acuerdo a las funciones a desempeñar:
- Usuario de cooperativa (gestión de buses propios).
- Oficinistas encargados de ventas.
- Usuario final (cliente que adquiere boletos).
- Gestión y venta de boletos en el rol de oficinista.
- Venta de boletos para el usuario final.
- Configuración de la aplicación (logo, colores, redes sociales, soporte, etc.)


## APLICACIONES MÓVILES:

1. Aplicación para usuarios:

- Buscar destinos y frecuencias disponibles.
- Visualizar información relevante del viaje.
- Comprar boletos y generar un código para el acceso al bus (QR, código de barras, o compatible con Android/iOS Wallet).
- Historial de compras.

2. Aplicación para personal del bus (chofer o ayudante):

- Registrar el acceso de pasajeros mediante escaneo del código generado por el boleto.

# REGLAS DEL NEGOCIO 

- Existen múltiples cooperativas de transporte interprovincial (Ej: Amazonas, Santa, Ambato, Flota Pelileo, etc.).
- Cada cooperativa tiene asignadas frecuencias por parte de la ANT (estas frecuencias se valida mediante una resolución emitida por la agencia) y la frecuencia consta de ciudad origen, ciudad destino y hora (Ambato-Quito 14:00).
- La cooperativa decide cuales de sus frecuencias asignadas utiliza para su hoja de ruta, estas frecuencia deben tener relación con la cantidad de buses que posee la cooperativa y es importante que se tenga días de parada.
- La hoja de trabajo se genera en base a las frecuencias habilidatas en el sistema, esta hoja se puede generar de forma manual o automática.
- Las frecuencias pueden estar activas o inactivas. Un exceso de buses sobre frecuencias implica días de parada para ciertos vehículos.
- Una frecuencia puede tener múltiples paradas intermedias. Ejemplo: Quito - Loja puede pasar por Latacunga, Riobamba y Cuenca.
- Los buses tienen diferentes configuraciones de asientos (ej. Normal, VIP), definidas por cada cooperativa.
- Al vender un boleto, se debe considerar tanto el tipo como la cantidad de asientos disponibles en el bus asignado. Ademas se puede seleccionar si es menor de edad, discapacitado o tercera edad para el correspondiente descuento (En la aplicación movil se debe calidad mediante la cédula).
- Debe permitirse la compra de boletos entre paradas intermedias (ej. Latacunga - Cuenca en la ruta Quito - Loja).


## FUNCIONALIDADES CLAVE EN LA VENTA

La aplicación (web y móvil) debe permitir:

- Buscar y seleccionar rutas disponibles.
- Filtrar resultados por:
- Cooperativa
- Tipo de asiento
- Marca del chasis y carrocería del bus
- Tipo de viaje (directo o con paradas)
- Visualizar información detallada del bus (cooperativa, número, placa, chasis, carrocería, fotografía, etc.).

UNIVERSIDAD TÉCNICA DE AMBATO FACULTAD DE INGENIERÍA EN SISTEMAS, ELECTRÓNICA E INDUSTRIAL

CARRERA DE SOFTWARE
CICLO ACADÉMICO MARZO - JULIO 2025

- Seleccionar asientos según disponibilidad y tipo, en función del número de pasajeros.
- Elegir el método de pago y procesar el mismo. Implementar al menos:
- Depósito o transferencia bancaria (con opción de subir comprobante para validación manual por el oficinista).
- PayPal
(Opcional: tarjetas de crédito o criptos).
- Generar y descargar el boleto (el boleto debe poder visualizar cuando el usuario desee, no solo al finalizar la compra). Al finalizar, ofrecer la opción de adquirir otro.
- Enviar notificaciones por correo electrónico o mediante la aplicación durante cada paso relevante del proceso.


# ENLACES DE UTILIDAD 

Documentación para integración de pagos con PayPal:

- https://developer.paypal.com/api/nvp-soap/ipn/IPNSimulator/
- https://developer.paypal.com/tools/sandbox/accounts/

Información referencial de buses:

- https://www.facebook.com/ecuabus



