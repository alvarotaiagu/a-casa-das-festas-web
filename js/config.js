/* =====================================================================
   A Casa das Festas · configuración (lo único que se toca sin programar)
   ===================================================================== */
window.CASA_CONFIG = {
  secciones: {
    // «Un día en la finca» (js/dia.js + css/dia.css). false = la sección y su
    // enlace del menú desaparecen sin tocar nada más. Solo true si el dueño
    // acepta que se hable de música hasta tarde (ver PENDIENTES.md).
    dia: true
  },
  // Pestaña «Verano» de Dormir y modo «Verano, por noches» del calendario.
  // Solo true cuando haya camas y número de registro turístico.
  verano: false,
  registroTuristico: '',          // p. ej. 'VUT-CO-000000' (aparece en Dormir y en el pie)

  contacto: {
    telefono: '',                  // '600 000 000' (visible)
    telefonoTel: '',               // '+34600000000' (para el enlace)
    whatsapp: '',                  // 'https://wa.me/34600000000'
    correo: ''
  },
  lugar: {
    municipio: '',                 // vacío = sale [municipio]
    ria: '',                       // nombre de la ría que se ve desde el dron
    // Lo que se busca en Google Maps al pulsar «Ver el mapa» (dirección o «lat,lon»).
    // Vacío = el botón avisa de que la dirección está pendiente.
    mapa: ''
  }
};
