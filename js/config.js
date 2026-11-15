/* =====================================================================
   A Casa das Festas · configuración (lo único que se toca sin programar)
   ===================================================================== */
window.CASA_CONFIG = {
  secciones: {
    // «Un día en la finca» (js/dia.js + css/dia.css). false = la sección y su
    // enlace del menú desaparecen sin tocar nada más.
    dia: true
  },
  // Pestaña «Verano» de Dormir y modo «Verano, por noches» del calendario.
  // Solo true cuando haya registro turístico (el dueño lo deja para la primavera).
  verano: false,
  registroTuristico: '',          // p. ej. 'VUT-CO-000000' (aparece en Dormir y en el pie)

  contacto: {
    telefono: '670 406 421',       // José Manuel, en castellano o gallego
    telefonoTel: '+34670406421',
    telefonoIngles: '619 946 834', // Mencía, en inglés
    telefonoInglesTel: '+34619946834',
    whatsapp: 'https://wa.me/34670406421',
    correo: 'josemanuel@barcayvila.com',
    instagram: 'aacasadasfestas'   // con «a» doble: @acasadasfestas es otra cuenta
  },
  lugar: {
    municipio: 'Vilela, Carballo (A Coruña)',
    // Lo que se busca en Google Maps al pulsar «Ver el mapa» (dirección o «lat,lon»).
    // Es el edificio que se ve en la ortofoto a ~480 m de la iglesia de San Miguel de Vilela.
    // El pin que manda el dueño (43.27804,-8.64927) es el cruce de la DP-1909 con la DP-1915.
    mapa: '43.2774,-8.6547'
  }
};
