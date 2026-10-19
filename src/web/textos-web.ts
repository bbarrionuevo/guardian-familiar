// Textos de la web. Español con «usted» (sirve en España y en Argentina), italiano con «tu».

import type { Lang } from '../motor/tipos';

export interface WebTexts {
  siteName: string;
  homeTitle: string;
  homeDescription: string;
  homeH1: string;
  homeLead: string;
  navCheck: string;
  navGuides: string;
  otherLang: string;
  checkerLabel: string;
  checkerPlaceholder: string;
  checkerImage: string;
  checkerImageChosen: string;
  checkerButton: string;
  checkerWorking: string;
  checkerNote: string;
  checkerError: string;
  checkerEmpty: string;
  levelNames: { alto: string; medio: string; sin_senales: string };
  shareFamily: string;
  shareMessage: (label: string, url: string) => string;
  shareGuide: string;
  shareGuideMessage: (title: string, url: string) => string;
  installH2: string;
  installAndroid: string[];
  installIphone: string;
  installButton: string;
  telegramH2: string;
  telegramText: string;
  telegramButton: string;
  guidesH2: string;
  guidesLead: string;
  guideExamples: string;
  guideExampleQuoted: (source: string) => string;
  guideExampleBased: (source: string) => string;
  guideSignals: string;
  guideWhatToDo: string;
  guideIfHappened: string;
  guideCheckH2: string;
  privacyTitle: string;
  privacyLink: string;
  footerNote: string;
  sharedTitle: string;
  sharedBack: string;
  notFoundTitle: string;
  notFoundText: string;
  family: FamilyTexts;
  // Página «ya pagué o di mis datos». Los pasos están en src/bot/urgente.ts.
  urgent: { title: string; description: string; intro: string; sourcesH2: string; link: string };
}

// Contacto de un familiar guardado en el teléfono (solo ahí: no se manda al servidor) y la página
// para que un hijo o una hija deje Pausa listo en el teléfono de sus padres.
export interface FamilyTexts {
  nav: string;
  cardH2: string;
  cardText: string;
  cardButton: string;
  // En los resultados con riesgo. {name} es el familiar guardado y {label}, el tipo de estafa.
  lead: string;
  call: string;
  whatsapp: string;
  message: string;
  setupLink: string;
  // La página.
  title: string;
  description: string;
  intro: string[];
  // «extra» dice qué va debajo del paso: el botón de instalar, el formulario, la prueba o Telegram.
  steps: { h2: string; text: string[]; extra?: 'install' | 'contact' | 'test' | 'telegram' }[];
  iphone: string;
  nameLabel: string;
  namePlaceholder: string;
  phoneLabel: string;
  phonePlaceholder: string;
  phoneHelp: string;
  save: string;
  saved: string;
  clear: string;
  cleared: string;
  invalid: string;
  testButton: string;
  testMessage: string;
}

export const WEB: Record<Lang, WebTexts> = {
  es: {
    siteName: 'Pausa',
    homeTitle: '¿Es una estafa este mensaje? Revíselo gratis',
    homeDescription:
      'Pegue el mensaje, la captura o el SMS que le llegó y le decimos si tiene señales de estafa y qué hacer. Gratis, sin registrarse y sin guardar sus mensajes.',
    homeH1: '¿Es una estafa este mensaje?',
    homeLead:
      'Antes de responder o pagar, haga una pausa. Pegue el mensaje que le llegó por WhatsApp, SMS o email, o suba una captura de pantalla: en segundos le decimos si tiene señales de estafa y qué hacer.',
    navCheck: 'Revisar un mensaje',
    navGuides: 'Estafas comunes',
    otherLang: 'Italiano',
    checkerLabel: 'Pegue aquí el mensaje que recibió',
    checkerPlaceholder: 'Por ejemplo: «Hola mamá, se me rompió el celular, este es mi número nuevo…»',
    checkerImage: 'Subir una captura',
    checkerImageChosen: 'Captura lista:',
    checkerButton: 'Revisar mensaje',
    checkerWorking: 'Revisando…',
    checkerNote: 'No guardamos lo que escribe ni las imágenes: se revisan y se descartan.',
    checkerError: 'No se pudo revisar el mensaje. Pruebe de nuevo en un momento.',
    checkerEmpty: 'Pegue el texto del mensaje o suba una captura.',
    levelNames: { alto: 'Riesgo alto', medio: 'Riesgo medio', sin_senales: 'Sin señales de estafa' },
    shareFamily: 'Avisar a mi familia por WhatsApp',
    shareMessage: (label, url) =>
      `⚠️ Ojo: me llegó un mensaje de ${label}. Lo revisé y tiene señales de estafa. Si les llega algo parecido, no respondan ni toquen enlaces. Pueden revisar cualquier mensaje gratis acá: ${url}`,
    shareGuide: 'Compartir esta alerta por WhatsApp',
    shareGuideMessage: (title, url) => `⚠️ Circula esta estafa: ${title}. Así se reconoce y qué hacer: ${url}`,
    installH2: 'Úselo desde WhatsApp, sin copiar ni pegar',
    installAndroid: [
      'Abra esta página en Chrome, en el celular.',
      'Toque los tres puntos ⋮ de arriba y elija «Instalar aplicación» o «Agregar a la pantalla principal».',
      'Desde ahora, cuando le llegue un mensaje raro en WhatsApp, manténgalo apretado, toque los tres puntos ⋮, elija «Compartir» y después «Pausa».',
    ],
    installIphone: 'En iPhone todavía no se puede compartir directo: copie el mensaje y péguelo en esta página, o use el bot de Telegram.',
    installButton: 'Instalar Pausa',
    telegramH2: 'También en Telegram',
    telegramText:
      'Si usa Telegram, reenvíe el mensaje a nuestro bot. Además puede vincular a un familiar: cuando le llegue algo de riesgo alto, le avisamos también a esa persona.',
    telegramButton: 'Abrir el bot en Telegram',
    guidesH2: 'Las estafas más comunes',
    guidesLead: 'Cómo funcionan, cómo reconocerlas y qué hacer si ya respondió o pagó.',
    guideExamples: 'Ejemplos de mensajes reales',
    guideExampleQuoted: (source) => `Mensaje citado por ${source}`,
    guideExampleBased: (source) => `Ejemplo armado a partir de lo que describe ${source}`,
    guideSignals: 'Señales para reconocerla',
    guideWhatToDo: 'Qué hacer',
    guideIfHappened: 'Si ya respondió o pagó',
    guideCheckH2: '¿Le llegó un mensaje parecido? Revíselo acá',
    privacyTitle: 'Privacidad',
    privacyLink: 'Privacidad',
    footerNote: 'Pausa no guarda los mensajes que revisa. Nunca le vamos a pedir datos, claves ni dinero.',
    sharedTitle: 'Resultado de la revisión',
    sharedBack: 'Revisar otro mensaje',
    notFoundTitle: 'Página no encontrada',
    notFoundText: 'Esta página no existe. Puede revisar un mensaje desde el inicio.',
    urgent: {
      title: 'Me estafaron: qué hacer ahora si ya pagó o dio sus datos',
      description:
        'Pasos para hacer ya mismo si pagó, transfirió o dio sus datos a un estafador, en España y en Argentina: banco, claves, la línea 017 de INCIBE, la denuncia y a quién llamar si está pasando ahora.',
      intro:
        'Si ya pagó, transfirió o le dio sus datos a alguien que resultó ser un estafador, actúe rápido y en este orden. Lo primero siempre es avisar al banco.',
      sourcesH2: 'Fuentes oficiales',
      link: '¿Ya pagó o dio sus datos? Qué hacer ahora',
    },
    family: {
      nav: 'Para la familia',
      cardH2: '¿Es para su mamá o su papá?',
      cardText:
        'Déjelo listo en el teléfono de ellos en dos minutos: la app instalada, su número guardado para que lo llamen con un toque y una prueba juntos.',
      cardButton: 'Cómo dejarlo listo',
      lead: 'Antes de responder o pagar, hable con {name}.',
      call: 'Llamar a {name}',
      whatsapp: 'Escribirle a {name} por WhatsApp',
      message: 'Me llegó un mensaje que puede ser una estafa ({label}). ¿Podemos hablar?',
      setupLink: 'Guarde el teléfono de un familiar para llamarlo con un toque',
      title: 'Cómo dejar Pausa listo en el teléfono de sus padres',
      description:
        'En dos minutos: instale la app en el teléfono de su mamá o su papá, guarde su número para que lo llamen con un toque y practiquen juntos con un mensaje de prueba.',
      intro: [
        'Las estafas por mensaje funcionan porque meten prisa: «es urgente», «hoy mismo», «su cuenta se bloquea». Pausa sirve para frenar ese impulso. Antes de responder o pagar, su mamá o su papá le manda el mensaje a Pausa y recibe una respuesta clara, con una sola cosa para hacer.',
        'Lo mejor es dejarlo listo juntos, con el teléfono de ellos en la mano. Son cinco pasos y llevan unos dos minutos.',
      ],
      steps: [
        {
          h2: '1. Instale la app',
          extra: 'install',
          text: [
            'Abra esta página en el teléfono de ellos, con Chrome. Toque el botón de abajo o, si no aparece, los tres puntos ⋮ de arriba y «Instalar aplicación». Queda el ícono de Pausa en la pantalla.',
          ],
        },
        {
          h2: '2. Guarde su nombre y su número',
          extra: 'contact',
          text: [
            'Cuando Pausa vea un mensaje con riesgo, va a mostrar un botón grande para llamarlo a usted y otro para escribirle por WhatsApp. Así, en el momento de la duda, hablar con usted está a un toque.',
            'Su nombre y su número quedan guardados solo en ese teléfono: a nosotros no nos llegan.',
          ],
        },
        {
          h2: '3. Hagan una prueba juntos',
          extra: 'test',
          text: [
            'Toque «Cargar un mensaje de prueba» y después «Revisar mensaje». Van a ver cómo responde Pausa ante una estafa y el botón para llamarlo a usted.',
          ],
        },
        {
          h2: '4. Explique la regla',
          text: [
            'Una sola regla, fácil de recordar: si llega algo raro, antes de responder, se lo mandamos a Pausa.',
            'En WhatsApp: se mantiene apretado el mensaje, se tocan los tres puntos ⋮, «Compartir» y «Pausa». También sirve para SMS, emails y capturas de pantalla.',
          ],
        },
        {
          h2: '5. Elijan una palabra clave familiar',
          text: [
            'Elijan juntos una palabra o una pregunta que solo conozca la familia. Si alguien escribe o llama diciendo que es un hijo o un nieto y pide plata, se le pregunta la palabra clave.',
            'Un estafador no la sabe, aunque escriba desde un número nuevo, mande una foto de perfil conocida o imite una voz.',
          ],
        },
        {
          h2: 'Si quiere que el aviso le llegue solo',
          extra: 'telegram',
          text: [
            'Con el bot de Telegram, cuando a su mamá o su papá le llega un mensaje de riesgo alto, el aviso le llega a usted sin que tengan que hacer nada. En el bot escriba /familia y mándele a ellos el enlace que le da.',
          ],
        },
      ],
      iphone:
        'En iPhone: abra la página con Safari, toque Compartir y «Agregar a inicio». Ahí todavía no se puede compartir directo desde WhatsApp: hay que copiar el mensaje y pegarlo en Pausa.',
      nameLabel: 'Su nombre, como lo llaman ellos',
      namePlaceholder: 'Por ejemplo: Lucía',
      phoneLabel: 'Su teléfono, con el código del país',
      phonePlaceholder: '+54 9 11 1234 5678',
      phoneHelp: 'Con + y el código del país: +34 para España, +39 para Italia y +54 9 para celulares de Argentina.',
      save: 'Guardar en este teléfono',
      saved: 'Listo. Cuando Pausa vea un riesgo, va a mostrar un botón para llamar a {name}.',
      clear: 'Borrar',
      cleared: 'Listo, se borró el contacto de este teléfono.',
      invalid: 'Escriba un nombre y el número con + y el código del país, por ejemplo +34 612 345 678.',
      testButton: 'Cargar un mensaje de prueba',
      testMessage:
        'Hola mamá, se me rompió el celular y este es mi número nuevo. Necesito que me hagas una transferencia hoy, es urgente. Después te explico.',
    },
  },
  it: {
    siteName: 'Pausa',
    homeTitle: 'È una truffa questo messaggio? Controllalo gratis',
    homeDescription:
      'Incolla il messaggio, lo screenshot o l’SMS che hai ricevuto e ti diciamo se ha segnali di truffa e cosa fare. Gratis, senza registrazione e senza conservare i tuoi messaggi.',
    homeH1: 'È una truffa questo messaggio?',
    homeLead:
      'Prima di rispondere o pagare, fai una pausa. Incolla il messaggio che ti è arrivato su WhatsApp, via SMS o email, oppure carica uno screenshot: in pochi secondi ti diciamo se ha segnali di truffa e cosa fare.',
    navCheck: 'Controlla un messaggio',
    navGuides: 'Truffe comuni',
    otherLang: 'Español',
    checkerLabel: 'Incolla qui il messaggio che hai ricevuto',
    checkerPlaceholder: 'Per esempio: «Ciao mamma, il mio cellulare è rotto, questo è il mio nuovo numero…»',
    checkerImage: 'Carica uno screenshot',
    checkerImageChosen: 'Screenshot pronto:',
    checkerButton: 'Controlla il messaggio',
    checkerWorking: 'Sto controllando…',
    checkerNote: 'Non conserviamo quello che scrivi né le immagini: vengono controllati e scartati.',
    checkerError: 'Non è stato possibile controllare il messaggio. Riprova tra un momento.',
    checkerEmpty: 'Incolla il testo del messaggio o carica uno screenshot.',
    levelNames: { alto: 'Rischio alto', medio: 'Rischio medio', sin_senales: 'Nessun segnale di truffa' },
    shareFamily: 'Avvisa la famiglia su WhatsApp',
    shareMessage: (label, url) =>
      `⚠️ Attenzione: mi è arrivato un messaggio di ${label}. L’ho controllato e ha segnali di truffa. Se vi arriva qualcosa di simile, non rispondete e non aprite link. Potete controllare qualsiasi messaggio gratis qui: ${url}`,
    shareGuide: 'Condividi questo avviso su WhatsApp',
    shareGuideMessage: (title, url) => `⚠️ Gira questa truffa: ${title}. Ecco come riconoscerla e cosa fare: ${url}`,
    installH2: 'Usalo da WhatsApp, senza copiare e incollare',
    installAndroid: [
      'Apri questa pagina con Chrome, sul telefono.',
      'Tocca i tre puntini ⋮ in alto e scegli «Installa app» o «Aggiungi a schermata Home».',
      'Da ora, quando ti arriva un messaggio strano su WhatsApp, tienilo premuto, tocca i tre puntini ⋮, scegli «Condividi» e poi «Pausa».',
    ],
    installIphone: 'Su iPhone non si può ancora condividere direttamente: copia il messaggio e incollalo in questa pagina, oppure usa il bot di Telegram.',
    installButton: 'Installa Pausa',
    telegramH2: 'Anche su Telegram',
    telegramText:
      'Se usi Telegram, inoltra il messaggio al nostro bot. Puoi anche collegare un familiare: quando ti arriva qualcosa a rischio alto, avvisiamo anche quella persona.',
    telegramButton: 'Apri il bot su Telegram',
    guidesH2: 'Le truffe più comuni',
    guidesLead: 'Come funzionano, come riconoscerle e cosa fare se hai già risposto o pagato.',
    guideExamples: 'Esempi di messaggi reali',
    guideExampleQuoted: (source) => `Messaggio citato da ${source}`,
    guideExampleBased: (source) => `Esempio ricostruito da quanto descrive ${source}`,
    guideSignals: 'I segnali per riconoscerla',
    guideWhatToDo: 'Cosa fare',
    guideIfHappened: 'Se hai già risposto o pagato',
    guideCheckH2: 'Ti è arrivato un messaggio simile? Controllalo qui',
    privacyTitle: 'Privacy',
    privacyLink: 'Privacy',
    footerNote: 'Pausa non conserva i messaggi che controlla. Non ti chiederemo mai dati, password o soldi.',
    sharedTitle: 'Risultato del controllo',
    sharedBack: 'Controlla un altro messaggio',
    notFoundTitle: 'Pagina non trovata',
    notFoundText: 'Questa pagina non esiste. Puoi controllare un messaggio dalla pagina iniziale.',
    urgent: {
      title: 'Truffa: cosa fare subito se hai già pagato o dato i tuoi dati',
      description:
        'Cosa fare subito se hai pagato, fatto un bonifico o dato i tuoi dati a un truffatore: banca, password, segnalazione alla Polizia Postale, denuncia e chi chiamare se sta succedendo adesso.',
      intro:
        'Se hai già pagato, fatto un bonifico o dato i tuoi dati a qualcuno che si è rivelato un truffatore, muoviti subito e in quest’ordine. La prima cosa è sempre avvisare la banca.',
      sourcesH2: 'Fonti ufficiali',
      link: 'Hai già pagato o dato i tuoi dati? Cosa fare adesso',
    },
    family: {
      nav: 'Per la famiglia',
      cardH2: 'È per tua mamma o tuo papà?',
      cardText:
        'Preparalo sul loro telefono in due minuti: l’app installata, il tuo numero salvato per farti chiamare con un tocco e una prova insieme.',
      cardButton: 'Come prepararlo',
      lead: 'Prima di rispondere o pagare, parla con {name}.',
      call: 'Chiama {name}',
      whatsapp: 'Scrivi a {name} su WhatsApp',
      message: 'Mi è arrivato un messaggio che può essere una truffa ({label}). Possiamo sentirci?',
      setupLink: 'Salva il numero di un familiare per chiamarlo con un tocco',
      title: 'Come preparare Pausa sul telefono dei tuoi genitori',
      description:
        'In due minuti: installa l’app sul telefono di tua mamma o tuo papà, salva il tuo numero per farti chiamare con un tocco e fate insieme una prova con un messaggio finto.',
      intro: [
        'Le truffe via messaggio funzionano perché mettono fretta: «è urgente», «entro oggi», «il conto verrà bloccato». Pausa serve a fermare quell’impulso. Prima di rispondere o pagare, tua mamma o tuo papà manda il messaggio a Pausa e riceve una risposta chiara, con una sola cosa da fare.',
        'La cosa migliore è prepararlo insieme, con il loro telefono in mano. Sono cinque passi e ci vogliono circa due minuti.',
      ],
      steps: [
        {
          h2: '1. Installa l’app',
          extra: 'install',
          text: [
            'Apri questa pagina sul loro telefono, con Chrome. Tocca il pulsante qui sotto oppure, se non compare, i tre puntini ⋮ in alto e «Installa app». Sulla schermata compare l’icona di Pausa.',
          ],
        },
        {
          h2: '2. Salva il tuo nome e il tuo numero',
          extra: 'contact',
          text: [
            'Quando Pausa vede un messaggio a rischio, mostra un grande pulsante per chiamarti e un altro per scriverti su WhatsApp. Così, nel momento del dubbio, parlare con te è a un tocco.',
            'Il tuo nome e il tuo numero restano salvati solo su quel telefono: a noi non arrivano.',
          ],
        },
        {
          h2: '3. Fate una prova insieme',
          extra: 'test',
          text: [
            'Tocca «Carica un messaggio di prova» e poi «Controlla il messaggio». Vedrete come risponde Pausa a una truffa e il pulsante per chiamarti.',
          ],
        },
        {
          h2: '4. Spiega la regola',
          text: [
            'Una sola regola, facile da ricordare: se arriva qualcosa di strano, prima di rispondere lo mandiamo a Pausa.',
            'Su WhatsApp: si tiene premuto il messaggio, si toccano i tre puntini ⋮, «Condividi» e «Pausa». Funziona anche con SMS, email e screenshot.',
          ],
        },
        {
          h2: '5. Scegliete una parola d’ordine di famiglia',
          text: [
            'Scegliete insieme una parola o una domanda che conosce solo la famiglia. Se qualcuno scrive o chiama dicendo di essere un figlio o un nipote e chiede soldi, gli si chiede la parola d’ordine.',
            'Un truffatore non la sa, anche se scrive da un numero nuovo, usa una foto profilo conosciuta o imita una voce.',
          ],
        },
        {
          h2: 'Se vuoi che l’avviso ti arrivi da solo',
          extra: 'telegram',
          text: [
            'Con il bot di Telegram, quando a tua mamma o tuo papà arriva un messaggio a rischio alto, l’avviso arriva a te senza che debbano fare nulla. Nel bot scrivi /famiglia e manda a loro il link che ti dà.',
          ],
        },
      ],
      iphone:
        'Su iPhone: apri la pagina con Safari, tocca Condividi e «Aggiungi alla schermata Home». Lì non si può ancora condividere direttamente da WhatsApp: bisogna copiare il messaggio e incollarlo in Pausa.',
      nameLabel: 'Il tuo nome, come ti chiamano loro',
      namePlaceholder: 'Per esempio: Lucia',
      phoneLabel: 'Il tuo telefono, con il prefisso del paese',
      phonePlaceholder: '+39 333 123 4567',
      phoneHelp: 'Con il + e il prefisso del paese: +39 per l’Italia, +34 per la Spagna e +54 9 per i cellulari argentini.',
      save: 'Salva su questo telefono',
      saved: 'Fatto. Quando Pausa vede un rischio, mostra un pulsante per chiamare {name}.',
      clear: 'Cancella',
      cleared: 'Fatto, il contatto è stato cancellato da questo telefono.',
      invalid: 'Scrivi un nome e il numero con il + e il prefisso del paese, per esempio +39 333 123 4567.',
      testButton: 'Carica un messaggio di prova',
      testMessage:
        'Ciao mamma, mi si è rotto il telefono e questo è il mio nuovo numero. Ho bisogno che mi fai un bonifico oggi, è urgente. Poi ti spiego.',
    },
  },
};
