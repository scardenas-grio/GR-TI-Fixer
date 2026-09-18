const usuariosTutorial = {
  id: "usuarios",

  nombre: "Gestión de Usuarios",

  version: "1.0.0",

  descripcion: "Aprende a administrar usuarios, roles y permisos.",

  duracion: "2 minutos",

  pasos: [
    {
      id: 1,

      element: ".usuarios-header",

      title: "Gestión de usuarios",

      description:
        "Desde este módulo puedes consultar y administrar los usuarios provenientes de LDAP, así como sus roles y permisos.",

      position: "bottom",
    },

    {
      id: 2,

      element: "#searchLDAP",

      title: "Buscar usuarios",

      description:
        "Utiliza este campo para localizar rápidamente un usuario proveniente de LDAP.",

      position: "bottom",
    },

    {
      id: 3,

      element: "#tablaLDAP",

      title: "Usuarios LDAP",

      description:
        "Aquí puedes consultar los usuarios sincronizados desde Active Directory y conocer su rol y estado.",

      position: "top",
    },

    {
      id: 4,

      element: ".btn-editar-usuarios",

      title: "Editar usuario",

      description:
        "Utiliza este botón para administrar el rol y los permisos del usuario seleccionado.",

      position: "bottom",
    },

    {
      id: 5,

      element: "#panelUsuario",

      title: "Panel de usuario",

      description:
        "En este panel puedes consultar y modificar el rol y los permisos asignados al usuario.",

      position: "left",
    },

    {
      id: 6,

      element: "#btnGuardarUsuario",

      title: "Guardar cambios",

      description:
        "Cuando termines de modificar el rol o los permisos, utiliza este botón para guardar los cambios.",

      position: "top",
    },
  ],
};

window.usuariosTutorial = usuariosTutorial;