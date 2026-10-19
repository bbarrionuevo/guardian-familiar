// Guías de las estafas más comunes, una página por idioma. Los ejemplos salen del banco de
// mensajes (data/banco) por id, con su fuente. Español con «usted», italiano con «tu».

import type { Pattern } from '../motor/tipos';

export interface GuideText {
  slug: string;
  title: string;
  description: string;
  intro: string[];
  examples: string[];
  signals: string[];
  whatToDo: string[];
  ifHappened: string[];
}

export interface Guide {
  id: string;
  pattern: Pattern;
  es: GuideText;
  it: GuideText;
}

export const GUIDES: Guide[] = [
  {
    id: 'familiar',
    pattern: 'familiar_numero_nuevo',
    es: {
      slug: 'hola-mama-numero-nuevo',
      title: '«Hola mamá, cambié de número»: la estafa del falso hijo por WhatsApp',
      description:
        'Le escriben desde un número desconocido diciendo ser su hijo o su hija y piden una transferencia urgente. Cómo darse cuenta y qué hacer.',
      intro: [
        'Es una de las estafas más comunes por WhatsApp en España y en Argentina. Alguien le escribe desde un número que usted no tiene agendado, dice ser su hijo, su hija o su nieto y le cuenta que se le rompió o se le perdió el teléfono.',
        'Al rato aparece el verdadero motivo: necesita que le haga una transferencia urgente, porque desde el teléfono nuevo «todavía no puede entrar al banco». La cuenta que le pasan es de otra persona y la plata no vuelve.',
      ],
      examples: ['es-001', 'ar-001'],
      signals: [
        'Le escriben desde un número que no tiene agendado y le piden que lo guarde.',
        'No le cuentan nada que solo su familiar sabría.',
        'Ponen excusas para no hablar por teléfono: «no puedo atender», «el micrófono no anda».',
        'Piden plata con apuro, casi siempre a una cuenta o un alias a nombre de otra persona.',
      ],
      whatToDo: [
        'No transfiera nada y no mande datos.',
        'Llame a su familiar al número de siempre, el que tiene agendado. Si no atiende, llame a otra persona de la familia.',
        'Si quiere comprobarlo por escrito, haga una pregunta que solo su familiar pueda contestar.',
        'Bloquee el número y denúncielo en WhatsApp.',
      ],
      ifHappened: [
        'Llame enseguida a su banco con el número que figura en su tarjeta y pida frenar o reclamar la transferencia.',
        'Haga la denuncia en la policía con capturas de los mensajes y los datos de la cuenta a la que transfirió.',
        'Avise a su familia: los estafadores suelen volver a intentarlo.',
      ],
    },
    it: {
      slug: 'ciao-mamma-numero-nuovo',
      title: '«Ciao mamma, ho cambiato numero»: la truffa del finto figlio su WhatsApp',
      description:
        'Ti scrivono da un numero sconosciuto fingendo di essere tuo figlio o tua figlia e chiedono un bonifico urgente. Come accorgersene e cosa fare.',
      intro: [
        'È una delle truffe più diffuse su WhatsApp in Italia. Qualcuno ti scrive da un numero che non hai in rubrica, dice di essere tuo figlio, tua figlia o tuo nipote e racconta che il telefono si è rotto o è andato perso.',
        'Poco dopo arriva la vera richiesta: un bonifico urgente, perché dal telefono nuovo «non riesce ancora ad accedere alla banca». Il conto indicato è di un’altra persona e i soldi non tornano.',
      ],
      examples: ['it-001', 'it-002'],
      signals: [
        'Ti scrivono da un numero che non hai salvato e ti chiedono di memorizzarlo.',
        'Non raccontano nulla che solo il tuo familiare saprebbe.',
        'Trovano scuse per non telefonare: «non posso parlare», «il microfono non funziona».',
        'Chiedono soldi con urgenza, di solito su un IBAN intestato a un’altra persona.',
      ],
      whatToDo: [
        'Non fare nessun bonifico e non mandare dati.',
        'Chiama il tuo familiare al numero di sempre, quello che hai in rubrica. Se non risponde, chiama un’altra persona di famiglia.',
        'Se vuoi verificare per iscritto, fai una domanda a cui solo il tuo familiare saprebbe rispondere.',
        'Blocca il numero e segnalalo su WhatsApp.',
      ],
      ifHappened: [
        'Chiama subito la tua banca al numero scritto sulla carta e chiedi di bloccare o richiamare il bonifico.',
        'Fai denuncia alla Polizia Postale (anche online su commissariatodips.it) o ai Carabinieri, con gli screenshot dei messaggi e l’IBAN.',
        'Avvisa la famiglia: spesso i truffatori ci riprovano.',
      ],
    },
  },
  {
    id: 'paquete',
    pattern: 'paquete_falso',
    es: {
      slug: 'sms-paquete-retenido',
      title: 'SMS de paquete retenido o pendiente de entrega: cómo saber si es falso',
      description:
        'Mensajes a nombre de Correos, Correo Argentino, Andreani u otra empresa de envíos que piden pagar unos centavos o confirmar datos. Cómo reconocerlos.',
      intro: [
        'Llega un SMS o un WhatsApp que parece de una empresa de envíos: su paquete está retenido, la dirección está incompleta o hay que pagar unos pocos euros o pesos de «gastos de envío» o de aduana.',
        'El enlace lleva a una página que copia la de la empresa y pide los datos de la tarjeta. El monto chico es el anzuelo: lo que buscan es su tarjeta.',
      ],
      examples: ['es-010', 'es-012', 'ar-015'],
      signals: [
        'No esperaba ningún paquete, o no compró nada en esa tienda.',
        'Le piden pagar un monto muy chico o «confirmar» la dirección en un enlace.',
        'El enlace no es la web oficial de la empresa: tiene palabras de más, guiones o terminaciones raras.',
        'Le apuran: «será devuelto», «último aviso».',
      ],
      whatToDo: [
        'No toque el enlace.',
        'Si espera un paquete, entre a la web o la app oficial de la empresa escribiendo la dirección a mano y busque el número de seguimiento que le dio la tienda.',
        'Borre el mensaje y bloquee el número.',
      ],
      ifHappened: [
        'Si puso los datos de la tarjeta, llame ya a su banco con el número de la tarjeta y pida bloquearla.',
        'Revise los movimientos de los próximos días y reclame los que no reconozca.',
        'Haga la denuncia con una captura del mensaje.',
      ],
    },
    it: {
      slug: 'sms-pacco-in-giacenza',
      title: 'SMS «pacco in giacenza» o «indirizzo non valido»: come capire se è una truffa',
      description:
        'Messaggi a nome di Poste Italiane, BRT, GLS o altri corrieri che chiedono di pagare pochi euro o confermare l’indirizzo. Come riconoscerli.',
      intro: [
        'Arriva un SMS o un messaggio WhatsApp che sembra di un corriere: il tuo pacco è in giacenza, l’indirizzo non è valido oppure bisogna pagare pochi euro di spese di spedizione o di riconsegna.',
        'Il link porta a una pagina che copia quella del corriere e chiede i dati della carta. La cifra piccola è l’esca: quello che vogliono è la tua carta.',
      ],
      examples: ['it-013', 'it-014', 'it-015'],
      signals: [
        'Non aspettavi nessun pacco, o non hai comprato niente in quel negozio.',
        'Ti chiedono di pagare una cifra molto piccola o di «confermare» l’indirizzo con un link.',
        'Il link non è il sito ufficiale del corriere: ha parole in più, trattini o finali strani.',
        'Ti mettono fretta: «tornerà al mittente», «ultimo avviso».',
      ],
      whatToDo: [
        'Non aprire il link.',
        'Se aspetti un pacco, entra nel sito o nell’app ufficiale del corriere scrivendo l’indirizzo a mano e cerca il codice di tracciamento che ti ha dato il negozio.',
        'Cancella il messaggio e blocca il numero.',
      ],
      ifHappened: [
        'Se hai inserito i dati della carta, chiama subito la banca al numero scritto sulla carta e chiedi di bloccarla.',
        'Controlla i movimenti dei prossimi giorni e contesta quelli che non riconosci.',
        'Fai denuncia alla Polizia Postale con uno screenshot del messaggio.',
      ],
    },
  },
  {
    id: 'banco-sms',
    pattern: 'banco_falso',
    es: {
      slug: 'sms-banco-cuenta-bloqueada',
      title: 'SMS del banco con «acceso sospechoso» o «cuenta bloqueada»: cómo reconocer el engaño',
      description:
        'Mensajes que imitan a su banco para que entre a un enlace o llame a un número. Las señales para darse cuenta y qué hacer.',
      intro: [
        'El mensaje usa el nombre de su banco y avisa algo alarmante: un acceso sospechoso, una compra que usted no hizo o que la cuenta se va a bloquear. Para «solucionarlo» le piden entrar a un enlace o llamar a un número.',
        'Si lo hace, una web falsa o un falso empleado le sacan las claves y los códigos que le llegan por SMS, y con eso vacían la cuenta. A veces el SMS aparece en la misma conversación que los avisos reales del banco, porque el nombre del remitente se puede falsificar.',
      ],
      examples: ['es-007', 'es-005', 'ar-006'],
      signals: [
        'Le asustan con un bloqueo, una compra o un acceso que usted no hizo.',
        'Le mandan a un enlace o a un número que vienen en el mismo mensaje.',
        'Le piden usuario, clave, códigos que le llegan por SMS o los datos de la tarjeta.',
        'Le apuran para que actúe ya.',
      ],
      whatToDo: [
        'No toque el enlace ni llame al número del mensaje.',
        'Entre a la app de su banco como siempre, o llame al número que figura en su tarjeta, y pregunte.',
        'Recuerde que su banco no le pide claves ni códigos por SMS, WhatsApp o teléfono.',
      ],
      ifHappened: [
        'Llame ya a su banco con el número de la tarjeta, cuente lo que pasó y pida bloquear el acceso y las tarjetas.',
        'Cambie la clave de la banca online desde la app oficial.',
        'Haga la denuncia en la policía.',
      ],
    },
    it: {
      slug: 'sms-banca-accesso-anomalo',
      title: 'SMS della banca con «accesso anomalo» o «conto bloccato»: come riconoscere l’inganno',
      description:
        'Messaggi che imitano la tua banca per farti aprire un link o chiamare un numero. I segnali per accorgersene e cosa fare.',
      intro: [
        'Il messaggio usa il nome della tua banca e avvisa di qualcosa di allarmante: un accesso anomalo, un movimento che non hai fatto o il conto che sta per essere bloccato. Per «risolvere» ti chiedono di aprire un link o di chiamare un numero.',
        'Se lo fai, un sito falso o un finto operatore ti rubano le credenziali e i codici che ti arrivano via SMS, e svuotano il conto. A volte l’SMS compare nella stessa conversazione degli avvisi veri della banca, perché il nome del mittente si può falsificare.',
      ],
      examples: ['it-007', 'it-009', 'it-011'],
      signals: [
        'Ti spaventano con un blocco, un pagamento o un accesso che non hai fatto.',
        'Ti mandano a un link o a un numero scritti nello stesso messaggio.',
        'Ti chiedono codice utente, password, codici via SMS o i dati della carta.',
        'Ti mettono fretta.',
      ],
      whatToDo: [
        'Non aprire il link e non chiamare il numero del messaggio.',
        'Entra nell’app della tua banca come sempre, o chiama il numero scritto sulla carta, e chiedi.',
        'Ricorda che la tua banca non ti chiede password né codici via SMS, WhatsApp o telefono.',
      ],
      ifHappened: [
        'Chiama subito la banca al numero della carta, racconta cosa è successo e chiedi di bloccare l’accesso e le carte.',
        'Cambia la password dell’home banking dall’app ufficiale.',
        'Fai denuncia alla Polizia Postale.',
      ],
    },
  },
  {
    id: 'banco-llamada',
    pattern: 'cuenta_segura',
    es: {
      slug: 'llamada-falso-empleado-banco',
      title: 'Llamada del falso empleado del banco: «hay que pasar su dinero a una cuenta segura»',
      description:
        'Le llaman diciendo ser del banco, le hablan de movimientos raros y le piden claves, códigos o que mueva su dinero. Cómo darse cuenta y qué hacer.',
      intro: [
        'Suele empezar con un SMS falso y seguir con una llamada. La persona dice ser del área de seguridad del banco, sabe su nombre y a veces hasta los últimos números de su tarjeta. En la pantalla puede aparecer incluso el número real del banco.',
        'Le cuenta que hay movimientos sospechosos y le ofrece ayuda: para «revertirlos» necesita que le dicte los códigos que le van a llegar, que instale una aplicación o que pase su dinero a una «cuenta segura». Todo eso es la estafa.',
      ],
      examples: ['es-009', 'ar-008', 'ar-013'],
      signals: [
        'Le llaman a usted, sin que usted haya llamado antes.',
        'Le piden códigos que le llegan por SMS, claves o los datos de la tarjeta.',
        'Le piden instalar una aplicación para «ayudarle» o mover el dinero a otra cuenta.',
        'No le dejan cortar: «no cuelgue», «es urgente».',
      ],
      whatToDo: [
        'Corte. Ningún banco pide claves ni códigos, ni mover el dinero a otra cuenta.',
        'Llame usted al banco con el número que figura en su tarjeta.',
        'No instale nada que le pidan por teléfono.',
      ],
      ifHappened: [
        'Llame ya a su banco con el número de la tarjeta y pida bloquear cuentas y tarjetas.',
        'Si instaló una aplicación, apague el teléfono y pida ayuda a alguien de confianza para borrarla.',
        'Haga la denuncia en la policía.',
      ],
    },
    it: {
      slug: 'falso-operatore-banca-conto-sicuro',
      title: 'Telefonata del finto operatore della banca: «sposti i soldi su un conto sicuro»',
      description:
        'Ti chiamano fingendo di essere la banca, parlano di movimenti strani e chiedono codici, password o di spostare i soldi. Come accorgersene e cosa fare.',
      intro: [
        'Spesso inizia con un SMS falso e continua con una telefonata. La persona dice di essere dell’ufficio sicurezza della banca, conosce il tuo nome e a volte le ultime cifre della carta. Sullo schermo può comparire perfino il numero vero della banca.',
        'Ti racconta che ci sono movimenti sospetti e ti offre aiuto: per «annullarli» ti chiede di leggergli i codici che ti arriveranno, di installare un’app o di spostare i soldi su un «conto sicuro». Tutto questo è la truffa.',
      ],
      examples: ['it-010', 'it-012'],
      signals: [
        'Ti chiamano loro, senza che tu abbia chiamato prima.',
        'Ti chiedono codici ricevuti via SMS, password o i dati della carta.',
        'Ti chiedono di installare un’app per «aiutarti» o di spostare i soldi su un altro conto.',
        'Non ti lasciano riattaccare: «resti in linea», «è urgente».',
      ],
      whatToDo: [
        'Riattacca. Nessuna banca chiede codici o password, né di spostare i soldi su un altro conto.',
        'Chiama tu la banca al numero scritto sulla carta.',
        'Non installare niente che ti chiedono al telefono.',
      ],
      ifHappened: [
        'Chiama subito la banca al numero della carta e chiedi di bloccare conti e carte.',
        'Se hai installato un’app, spegni il telefono e chiedi aiuto a una persona di fiducia per cancellarla.',
        'Fai denuncia alla Polizia Postale o ai Carabinieri.',
      ],
    },
  },
  {
    id: 'codigo-whatsapp',
    pattern: 'codigo_verificacion',
    es: {
      slug: 'codigo-whatsapp-por-error',
      title: '«Te mandé un código por error»: así roban cuentas de WhatsApp',
      description:
        'Un contacto o un desconocido le pide el código de 6 dígitos que le llegó por SMS, o que vote en un concurso. Por qué no hay que darlo y qué hacer.',
      intro: [
        'Para abrir su WhatsApp en otro teléfono hace falta un código de 6 dígitos que WhatsApp le manda por SMS. Los estafadores intentan registrar su número y después le piden ese código con una excusa: «te lo mandé por error», «es para un concurso», «votá por mi prima».',
        'Muchas veces el pedido llega desde la cuenta de un amigo que ya cayó. Si lo da, usted pierde su WhatsApp y lo usan para pedir plata a sus contactos.',
      ],
      examples: ['es-026', 'ar-010', 'es-027'],
      signals: [
        'Le llega un SMS con un código que usted no pidió.',
        'Alguien le pide ese código, aunque sea un contacto conocido.',
        'Le piden votar en un concurso o entrar a un enlace para «ayudar».',
      ],
      whatToDo: [
        'No pase nunca ese código, a nadie.',
        'Active la verificación en dos pasos de WhatsApp (Ajustes → Cuenta → Verificación en dos pasos) y elija un PIN.',
        'Si el pedido viene de un contacto, llámelo por teléfono: puede que le hayan robado la cuenta.',
      ],
      ifHappened: [
        'Vuelva a registrar su número en WhatsApp: le llegará un código nuevo y la otra persona perderá el acceso.',
        'Avise a sus contactos que no respondan pedidos de plata desde su cuenta.',
        'Si no puede recuperarla, escriba al soporte desde la app (Ajustes → Ayuda).',
      ],
    },
    it: {
      slug: 'codice-whatsapp-per-errore',
      title: '«Ti ho mandato un codice per errore»: così rubano gli account WhatsApp',
      description:
        'Un contatto o uno sconosciuto ti chiede il codice di 6 cifre arrivato via SMS, o di votare in un concorso. Perché non darlo mai e cosa fare.',
      intro: [
        'Per aprire il tuo WhatsApp su un altro telefono serve un codice di 6 cifre che WhatsApp ti manda via SMS. I truffatori provano a registrare il tuo numero e poi ti chiedono quel codice con una scusa: «te l’ho mandato per errore», «è per un concorso», «vota per mia nipote».',
        'Spesso la richiesta arriva dall’account di un amico a cui è già successo. Se lo dai, perdi il tuo WhatsApp e lo usano per chiedere soldi ai tuoi contatti.',
      ],
      examples: ['it-033', 'it-034'],
      signals: [
        'Ti arriva un SMS con un codice che non hai chiesto.',
        'Qualcuno ti chiede quel codice, anche se è un contatto che conosci.',
        'Ti chiedono di votare in un concorso o di aprire un link per «aiutare».',
      ],
      whatToDo: [
        'Non dare mai quel codice a nessuno.',
        'Attiva la verifica in due passaggi di WhatsApp (Impostazioni → Account → Verifica in due passaggi) e scegli un PIN.',
        'Se la richiesta arriva da un contatto, telefonagli: forse gli hanno rubato l’account.',
      ],
      ifHappened: [
        'Registra di nuovo il tuo numero su WhatsApp: ti arriverà un codice nuovo e l’altra persona perderà l’accesso.',
        'Avvisa i tuoi contatti di non rispondere a richieste di soldi dal tuo account.',
        'Se non riesci a recuperarlo, scrivi all’assistenza dall’app (Impostazioni → Aiuto).',
      ],
    },
  },
  {
    id: 'multa',
    pattern: 'multa_impuesto_falso',
    es: {
      slug: 'multa-o-devolucion-falsa',
      title: 'Multas, peajes y devoluciones de impuestos falsas por SMS o email',
      description:
        'Mensajes a nombre de la DGT, la Agencia Tributaria, ARCA u otros organismos que piden pagar una multa o cobrar una devolución en un enlace.',
      intro: [
        'Usan el nombre de un organismo público: una multa de tránsito sin pagar, un peaje pendiente, una deuda con el fisco o, al revés, una devolución de impuestos a su favor.',
        'Siempre hay un enlace para pagar o para «completar el formulario». La página copia el diseño oficial y se queda con los datos de su tarjeta.',
      ],
      examples: ['es-013', 'es-014', 'ar-018'],
      signals: [
        'El mensaje llega por SMS, WhatsApp o email con un enlace para pagar o cobrar.',
        'Le dan un plazo muy corto o le amenazan con recargos.',
        'Le piden los datos de la tarjeta para «recibir» una devolución.',
        'La dirección del enlace no es la del organismo (en España terminan en .gob.es; en Argentina, en .gob.ar).',
      ],
      whatToDo: [
        'No toque el enlace.',
        'Si cree que puede tener una multa o una devolución, entre a la web oficial del organismo escribiendo la dirección a mano, o pregunte en una oficina.',
        'Para cobrar una devolución nunca hace falta poner los datos de la tarjeta.',
      ],
      ifHappened: [
        'Si puso los datos de la tarjeta, llame a su banco con el número de la tarjeta y pida bloquearla.',
        'Revise los movimientos y reclame los que no reconozca.',
        'Haga la denuncia con una captura del mensaje.',
      ],
    },
    it: {
      slug: 'multa-pedaggio-rimborso-falso',
      title: 'Multe, pedaggi e rimborsi fiscali falsi via SMS o email',
      description:
        'Messaggi a nome di PagoPA, Telepass, Agenzia delle Entrate o altri enti che chiedono di pagare una multa o ricevere un rimborso tramite un link.',
      intro: [
        'Usano il nome di un ente o di un’azienda nota: una multa non pagata, un pedaggio in sospeso o, al contrario, un rimborso fiscale a tuo favore.',
        'C’è sempre un link per pagare o per «completare la procedura». La pagina copia la grafica ufficiale e si tiene i dati della tua carta.',
      ],
      examples: ['it-016', 'it-017', 'it-018'],
      signals: [
        'Il messaggio arriva via SMS, WhatsApp o email con un link per pagare o incassare.',
        'Ti danno una scadenza molto breve o minacciano more e sanzioni.',
        'Ti chiedono i dati della carta per «ricevere» un rimborso.',
        'L’indirizzo del link non è quello dell’ente (i siti delle amministrazioni finiscono in .gov.it).',
      ],
      whatToDo: [
        'Non aprire il link.',
        'Se pensi di avere una multa o un rimborso, entra nel sito ufficiale scrivendo l’indirizzo a mano, oppure chiedi allo sportello.',
        'Per ricevere un rimborso non serve mai inserire i dati della carta.',
      ],
      ifHappened: [
        'Se hai inserito i dati della carta, chiama la banca al numero della carta e chiedi di bloccarla.',
        'Controlla i movimenti e contesta quelli che non riconosci.',
        'Fai denuncia alla Polizia Postale con uno screenshot del messaggio.',
      ],
    },
  },
  {
    id: 'ayuda-publica',
    pattern: 'ayuda_publica_falsa',
    es: {
      slug: 'falsas-ayudas-jubilacion-bonos',
      title: 'Falsas ayudas, bonos y subsidios para jubilados (Seguridad Social, ANSES, PAMI)',
      description:
        'Mensajes que prometen un bono, un subsidio o un pago extra de la jubilación a cambio de entrar a un enlace o dar sus datos. Cómo reconocerlos.',
      intro: [
        'Prometen dinero: un bono de fin de año, un subsidio para medicamentos, una prestación pendiente o un aumento de la jubilación. Para cobrarlo hay que «registrarse» en un enlace, mandar una foto del documento o dar los datos del banco.',
        'Con eso los estafadores entran a su cuenta, sacan préstamos a su nombre o le vacían la tarjeta.',
      ],
      examples: ['ar-011', 'ar-012', 'es-016'],
      signals: [
        'Le ofrecen un dinero que usted no pidió.',
        'Para cobrarlo hay que entrar a un enlace o «registrarse».',
        'Le piden una foto del documento, una selfie o los datos de la tarjeta.',
        'El mensaje llega por WhatsApp o SMS, no desde la web oficial del organismo.',
      ],
      whatToDo: [
        'No toque el enlace ni mande fotos de su documento.',
        'Consulte en la web oficial (seg-social.es, anses.gob.ar, pami.org.ar) escribiendo la dirección a mano, o en una oficina.',
        'Recuerde que los organismos públicos no piden datos de la tarjeta ni claves por WhatsApp.',
      ],
      ifHappened: [
        'Si dio datos de la tarjeta o del banco, llame a su banco con el número de la tarjeta.',
        'Si mandó fotos del documento, haga la denuncia: así queda constancia si alguien lo usa para pedir un préstamo.',
        'Avise a su familia para que estén atentos a llamadas o mensajes parecidos.',
      ],
    },
    it: {
      slug: 'falsi-bonus-inps',
      title: 'Falsi bonus e pagamenti INPS: gli SMS che chiedono di aggiornare i dati',
      description:
        'SMS ed email a nome dell’INPS che promettono un bonus o minacciano la sospensione dei pagamenti, con un link per aggiornare i dati. Come riconoscerli.',
      intro: [
        'Promettono soldi, come un bonus o un rimborso, oppure minacciano di sospendere la pensione o un pagamento. Per evitarlo bisogna aprire un link e «aggiornare i dati», caricare un documento, la busta paga o un selfie.',
        'Con questi dati i truffatori svuotano il conto, chiedono prestiti a tuo nome o usano la tua identità per altre truffe.',
      ],
      examples: ['it-019', 'it-020', 'it-021'],
      signals: [
        'Ti offrono soldi che non hai chiesto, o minacciano di sospendere un pagamento.',
        'C’è un link per aggiornare i dati o completare una verifica.',
        'Ti chiedono documento d’identità, selfie, IBAN o dati della carta.',
        'Il messaggio arriva via SMS, WhatsApp o email, non dalla tua area riservata.',
      ],
      whatToDo: [
        'Non aprire il link e non mandare documenti.',
        'Controlla nella tua area riservata MyINPS, entrando dal sito inps.it scritto a mano o dall’app ufficiale, oppure chiama il contact center.',
        'Ricorda che l’INPS avvisa di non aprire link ricevuti via SMS o email.',
      ],
      ifHappened: [
        'Se hai dato dati della carta o del conto, chiama subito la banca al numero della carta.',
        'Se hai mandato documenti, fai denuncia alla Polizia Postale: resta traccia se qualcuno li usa per un prestito.',
        'Avvisa la famiglia di fare attenzione a messaggi simili.',
      ],
    },
  },
  {
    id: 'falso-agente',
    pattern: 'falso_agente',
    es: {
      slug: 'falso-policia-abogado-hospital',
      title: 'Llamada del falso policía, abogado u hospital: «su hijo tuvo un accidente»',
      description:
        'Le llaman diciendo que un familiar tuvo un accidente o está detenido y piden dinero, joyas o que alguien pase a buscarlos. Cómo actuar.',
      intro: [
        'Juega con el miedo. Suena el teléfono y alguien dice ser policía, abogado, médico o fiscal: su hijo, su hija o su nieto tuvo un accidente, lastimó a alguien o está detenido. Para ayudarlo hace falta dinero ya, para una fianza, una operación o un abogado. A veces se escucha a alguien llorando que dice ser su familiar.',
        'Si usted dice que no tiene efectivo, le piden joyas, dólares o tarjetas, y mandan a alguien a su casa a buscarlos.',
      ],
      examples: ['es-003', 'ar-004', 'ar-007'],
      signals: [
        'Le llaman con una urgencia terrible sobre un familiar.',
        'Le piden dinero, joyas o tarjetas, y que no corte ni llame a nadie.',
        'Ofrecen mandar a alguien a su casa a buscar el dinero.',
        'Ningún policía, juez ni hospital cobra fianzas ni operaciones por teléfono.',
      ],
      whatToDo: [
        'Corte la llamada.',
        'Llame usted a su familiar al número de siempre, y si no atiende, a otra persona de la familia.',
        'No entregue dinero, joyas ni tarjetas a nadie que venga a su casa.',
        'Si alguien se presenta en su puerta, no abra y llame a la policía (112 en España, 911 en Argentina).',
      ],
      ifHappened: [
        'Llame a la policía cuanto antes y describa a la persona que vino.',
        'Si entregó tarjetas, llame al banco para bloquearlas.',
        'Hable con su familia. No es su culpa: estas bandas son profesionales.',
      ],
    },
    it: {
      slug: 'finto-carabiniere-incidente',
      title: 'Telefonata del finto carabiniere, avvocato o medico: «suo figlio ha avuto un incidente»',
      description:
        'Ti chiamano dicendo che un familiare ha avuto un incidente o è stato arrestato e chiedono soldi, gioielli o di consegnarli a qualcuno che passa da casa.',
      intro: [
        'Gioca sulla paura. Squilla il telefono e qualcuno dice di essere un carabiniere, un avvocato o un medico: tuo figlio, tua figlia o tuo nipote ha avuto un incidente, ha investito qualcuno o è stato fermato. Per aiutarlo servono soldi subito, per una cauzione, un’operazione o un avvocato.',
        'Se dici di non avere contanti, chiedono gioielli, oro o carte, e mandano qualcuno a casa a ritirarli.',
      ],
      examples: ['it-004', 'it-005', 'it-040'],
      signals: [
        'Ti chiamano con un’urgenza terribile su un familiare.',
        'Ti chiedono soldi, gioielli o carte, e di non riattaccare né chiamare nessuno.',
        'Si offrono di mandare qualcuno a casa a ritirare i soldi.',
        'Nessun carabiniere, giudice o ospedale chiede cauzioni o pagamenti al telefono.',
      ],
      whatToDo: [
        'Riattacca.',
        'Chiama tu il tuo familiare al numero di sempre e, se non risponde, un’altra persona di famiglia.',
        'Non consegnare soldi, gioielli o carte a nessuno che venga a casa.',
        'Se qualcuno si presenta alla porta, non aprire e chiama il 112.',
      ],
      ifHappened: [
        'Chiama il 112 il prima possibile e descrivi la persona che è venuta.',
        'Se hai consegnato carte, chiama la banca per bloccarle.',
        'Parlane con la famiglia. Non è colpa tua: queste bande sono professionisti.',
      ],
    },
  },
  {
    id: 'trabajo',
    pattern: 'trabajo_falso',
    es: {
      slug: 'trabajo-dar-me-gusta',
      title: 'Ofertas de trabajo por dar «me gusta» o escribir reseñas: la estafa de las tareas',
      description:
        'Le ofrecen ganar dinero fácil desde casa dando «me gusta» a videos. Al principio pagan poco y después piden que deposite. Cómo reconocerla.',
      intro: [
        'Llega un WhatsApp de alguien que dice ser de una agencia: le ofrecen un trabajo desde casa, sin experiencia, por dar «me gusta» a videos, seguir cuentas o escribir reseñas.',
        'Las primeras tareas se pagan de verdad, con montos chicos, para ganar su confianza. Después lo pasan a un grupo de Telegram y le piden que deposite dinero para «desbloquear» tareas mejores. Ese dinero no vuelve.',
      ],
      examples: ['es-019', 'ar-021', 'ar-022'],
      signals: [
        'Le ofrecen un trabajo que usted no buscó, por WhatsApp o Telegram.',
        'Pagan mucho por tareas muy simples.',
        'Le piden que deposite dinero, compre algo o «invierta» para seguir.',
        'Le pasan a otro número o a un grupo de Telegram.',
      ],
      whatToDo: [
        'No responda y bloquee el número.',
        'Recuerde que un trabajo de verdad nunca le pide dinero para empezar ni para seguir.',
      ],
      ifHappened: [
        'No deposite más, aunque le prometan devolverle todo.',
        'Haga la denuncia con las capturas y los datos de las cuentas a las que pagó.',
        'Desconfíe de quien le ofrezca «recuperar» el dinero a cambio de un pago: suele ser la misma estafa.',
      ],
    },
    it: {
      slug: 'lavoro-like-recensioni',
      title: 'Offerte di lavoro per mettere «mi piace» o scrivere recensioni: la truffa dei compiti',
      description:
        'Ti offrono soldi facili da casa per mettere «mi piace» ai video. All’inizio pagano poco, poi chiedono di versare soldi. Come riconoscerla.',
      intro: [
        'Arriva un WhatsApp da qualcuno che dice di essere di un’agenzia: ti offrono un lavoro da casa, senza esperienza, per mettere «mi piace» ai video, seguire profili o scrivere recensioni.',
        'I primi compiti vengono pagati davvero, con piccole cifre, per guadagnare la tua fiducia. Poi ti spostano in un gruppo Telegram e ti chiedono di versare soldi per «sbloccare» compiti migliori. Quei soldi non tornano.',
      ],
      examples: ['it-024', 'it-025', 'it-026'],
      signals: [
        'Ti offrono un lavoro che non hai cercato, su WhatsApp o Telegram.',
        'Pagano molto per compiti molto semplici.',
        'Ti chiedono di versare soldi, comprare qualcosa o «investire» per continuare.',
        'Ti spostano su un altro numero o in un gruppo Telegram.',
      ],
      whatToDo: [
        'Non rispondere e blocca il numero.',
        'Ricorda che un lavoro vero non ti chiede mai soldi per iniziare o per continuare.',
      ],
      ifHappened: [
        'Non versare altro, anche se promettono di restituirti tutto.',
        'Fai denuncia alla Polizia Postale con gli screenshot e i dati dei conti su cui hai pagato.',
        'Diffida di chi ti offre di «recuperare» i soldi in cambio di un pagamento: di solito è la stessa truffa.',
      ],
    },
  },
  {
    id: 'premio',
    pattern: 'premio_falso',
    es: {
      slug: 'regalo-supermercado-puntos',
      title: 'Falsos regalos de supermercados y puntos que vencen: cupones que piden datos',
      description:
        'Cadenas de WhatsApp y SMS con cupones de supermercado, premios o puntos que vencen hoy. Cómo reconocer el engaño y qué hacer.',
      intro: [
        'Una cadena que llega de un contacto: un supermercado conocido cumple años y regala cupones, o los puntos de su tarjeta vencen hoy y puede canjearlos por un televisor.',
        'Solo hay que contestar unas preguntas, compartir el mensaje con muchos contactos o pagar el envío. Al final le piden los datos de la tarjeta, o el enlace sirve para juntar números de teléfono para nuevas estafas.',
        'Funciona porque la cadena llega de gente conocida: una amiga, un pariente, el grupo del barrio. Quien la reenvía se la cree y no sabe que está ayudando a los estafadores. Los supermercados de verdad anuncian sus promociones en su web y en sus locales, no con cadenas de WhatsApp.',
      ],
      examples: ['es-020', 'es-021', 'ar-023'],
      signals: [
        'Un regalo demasiado generoso de una marca conocida.',
        'Le piden compartir la cadena, contestar una encuesta o pagar el envío.',
        'El enlace no es la web oficial de la marca.',
        'Le apuran: «solo hoy», «quedan pocas unidades».',
      ],
      whatToDo: [
        'No toque el enlace ni comparta la cadena.',
        'Si quiere comprobarlo, entre a la web oficial de la marca escribiendo la dirección a mano.',
        'Avise a quien se la mandó: seguramente no sabe que es falsa.',
      ],
      ifHappened: [
        'Si puso los datos de la tarjeta, llame a su banco con el número de la tarjeta y pida bloquearla.',
        'Revise los movimientos de los próximos días.',
        'Haga la denuncia con una captura del mensaje.',
      ],
    },
    it: {
      slug: 'buoni-spesa-falsi',
      title: 'Falsi buoni spesa e regali dei supermercati: le catene su WhatsApp',
      description:
        'Catene su WhatsApp e SMS con buoni spesa, premi o regali di supermercati famosi. Come riconoscere l’inganno e cosa fare.',
      intro: [
        'Una catena che arriva da un contatto: un supermercato famoso compie gli anni e regala buoni spesa, oppure hai vinto un premio.',
        'Basta rispondere a un breve questionario, inoltrare il messaggio a molti contatti o pagare la spedizione. Alla fine chiedono i dati della carta, oppure il link serve a raccogliere numeri di telefono per altre truffe.',
        'Funziona perché la catena arriva da persone che conosci: un’amica, un parente, il gruppo della parrocchia. Chi la inoltra ci crede davvero e non sa di aiutare i truffatori. I supermercati veri annunciano le promozioni sul proprio sito e nei negozi, non con catene su WhatsApp.',
      ],
      examples: ['it-027', 'it-028'],
      signals: [
        'Un regalo troppo generoso da un marchio famoso.',
        'Ti chiedono di inoltrare la catena, rispondere a un questionario o pagare la spedizione.',
        'Il link non è il sito ufficiale del marchio.',
        'Ti mettono fretta: «solo oggi», «ne restano pochi».',
      ],
      whatToDo: [
        'Non aprire il link e non inoltrare la catena.',
        'Se vuoi verificare, entra nel sito ufficiale del marchio scrivendo l’indirizzo a mano.',
        'Avvisa chi te l’ha mandata: probabilmente non sa che è falsa.',
      ],
      ifHappened: [
        'Se hai inserito i dati della carta, chiama la banca al numero della carta e chiedi di bloccarla.',
        'Controlla i movimenti dei prossimi giorni.',
        'Fai denuncia alla Polizia Postale con uno screenshot del messaggio.',
      ],
    },
  },
  {
    id: 'compraventa',
    pattern: 'compraventa_falsa',
    es: {
      slug: 'comprador-falso-wallapop-mercado-libre',
      title: 'Comprador falso en Wallapop, Vinted o Mercado Libre: el enlace para «cobrar»',
      description:
        'Le dicen que ya pagaron su artículo y le mandan un enlace para cobrar, o un comprobante falso. Cómo vender sin caer.',
      intro: [
        'Usted vende algo por internet y aparece un comprador muy dispuesto. No negocia, dice que ya pagó y le manda un enlace para «recibir el dinero», o un comprobante de transferencia.',
        'El enlace imita a la plataforma y le pide los datos de la tarjeta; el comprobante es falso. Otra variante: «le transferí de más por error, devuélvame la diferencia».',
      ],
      examples: ['es-022', 'es-023', 'ar-025'],
      signals: [
        'El comprador quiere seguir la conversación fuera de la app, por WhatsApp o email.',
        'Le manda un enlace para cobrar. Para cobrar nunca hace falta poner la tarjeta.',
        'Le muestra un comprobante, pero el dinero no aparece en su cuenta.',
        'Le pide devolver una diferencia que «pagó de más».',
      ],
      whatToDo: [
        'Cobre solo dentro de la app de la plataforma.',
        'Antes de entregar o enviar, mire en la app de su banco o de Mercado Pago que el dinero esté acreditado.',
        'No toque enlaces que le mande el comprador.',
      ],
      ifHappened: [
        'Si puso los datos de la tarjeta, llame a su banco con el número de la tarjeta.',
        'Denuncie al usuario dentro de la plataforma.',
        'Haga la denuncia con las capturas de la conversación.',
      ],
    },
    it: {
      slug: 'acquirente-falso-subito-vinted',
      title: 'Acquirente falso su Subito o Vinted: il link per «ricevere il pagamento»',
      description:
        'Ti dicono di aver già pagato il tuo oggetto e mandano un link per incassare, o propongono il pagamento tramite corriere. Come vendere senza cadere nella truffa.',
      intro: [
        'Vendi qualcosa online e arriva un acquirente molto deciso. Non tratta, dice di aver già pagato e ti manda un link per «ricevere il pagamento», oppure propone che un corriere ritiri l’oggetto e ti consegni i soldi.',
        'Il link imita la piattaforma e chiede i dati della carta. Nella variante del corriere ti chiedono di pagare prima una «assicurazione» o una spesa di spedizione che non verrà mai restituita.',
      ],
      examples: ['it-029', 'it-030'],
      signals: [
        'L’acquirente vuole continuare fuori dall’app, su WhatsApp o via email.',
        'Ti manda un link per incassare. Per ricevere soldi non serve mai inserire la carta.',
        'Propone un pagamento tramite corriere e ti chiede di pagare qualcosa prima.',
        'Ti mostra una ricevuta, ma i soldi non compaiono sul conto.',
      ],
      whatToDo: [
        'Incassa solo dentro l’app della piattaforma.',
        'Prima di spedire, controlla nell’app della banca che i soldi siano arrivati davvero.',
        'Non aprire link mandati dall’acquirente.',
      ],
      ifHappened: [
        'Se hai inserito i dati della carta, chiama la banca al numero della carta.',
        'Segnala l’utente sulla piattaforma.',
        'Fai denuncia alla Polizia Postale con gli screenshot della conversazione.',
      ],
    },
  },
  {
    id: 'inversion',
    pattern: 'inversion_falsa',
    es: {
      slug: 'inversion-falsa-famosos-cripto',
      title: 'Inversiones falsas con famosos y criptomonedas: «gane miles desde su casa»',
      description:
        'Anuncios y mensajes con famosos que recomiendan una plataforma de inversión, ganancias garantizadas y un asesor que llama. Cómo reconocer la estafa.',
      intro: [
        'Empieza con un anuncio en redes o un video en el que un famoso, un periodista o un político parece recomendar una plataforma para ganar dinero con criptomonedas o inteligencia artificial. Muchas veces el video está hecho con IA.',
        'Usted deja su teléfono y le llama un «asesor» muy amable que le hace invertir una cantidad chica. En la plataforma ve ganancias que crecen, le piden invertir más, y cuando quiere retirar aparecen comisiones e impuestos que nunca terminan.',
      ],
      examples: ['es-017', 'ar-019'],
      signals: [
        'Ganancias garantizadas o muy altas en poco tiempo.',
        'Un famoso que «recomienda» una inversión en un anuncio o un video.',
        'Le presionan para invertir más y rápido.',
        'Para retirar le piden pagar antes comisiones o impuestos.',
      ],
      whatToDo: [
        'No invierta por anuncios ni por llamadas que no pidió.',
        'Consulte si la empresa está autorizada: en España, en la web de la CNMV; en Argentina, en la de la CNV.',
        'No instale programas de acceso remoto (AnyDesk, TeamViewer) a pedido de un asesor.',
      ],
      ifHappened: [
        'No pague nada más para «liberar» su dinero.',
        'Avise a su banco y haga la denuncia con todos los datos de la plataforma y del asesor.',
        'Desconfíe de quien ofrezca recuperar lo perdido a cambio de un pago: es otra estafa.',
      ],
    },
    it: {
      slug: 'investimenti-falsi-vip-cripto',
      title: 'Investimenti falsi con personaggi famosi e criptovalute: «guadagna migliaia da casa»',
      description:
        'Pubblicità e messaggi con personaggi famosi che consigliano una piattaforma di investimento, guadagni garantiti e un consulente che chiama. Come riconoscere la truffa.',
      intro: [
        'Comincia con una pubblicità sui social o un video in cui un personaggio famoso, un giornalista o un politico sembra consigliare una piattaforma per guadagnare con le criptovalute o l’intelligenza artificiale. Spesso il video è fatto con l’IA.',
        'Lasci il tuo numero e ti chiama un «consulente» gentilissimo che ti fa investire una piccola somma. Sulla piattaforma vedi guadagni che crescono, ti chiedono di investire di più e, quando vuoi ritirare, spuntano commissioni e tasse che non finiscono mai.',
      ],
      examples: ['it-022', 'it-023'],
      signals: [
        'Guadagni garantiti o altissimi in poco tempo.',
        'Un personaggio famoso che «consiglia» un investimento in una pubblicità o in un video.',
        'Ti mettono pressione per investire di più e in fretta.',
        'Per ritirare ti chiedono di pagare prima commissioni o tasse.',
      ],
      whatToDo: [
        'Non investire tramite pubblicità o telefonate che non hai chiesto.',
        'Controlla se la società è autorizzata sul sito della CONSOB.',
        'Non installare programmi di accesso remoto (AnyDesk, TeamViewer) su richiesta di un consulente.',
      ],
      ifHappened: [
        'Non pagare altro per «sbloccare» i tuoi soldi.',
        'Avvisa la banca e fai denuncia con tutti i dati della piattaforma e del consulente.',
        'Diffida di chi offre di recuperare i soldi persi in cambio di un pagamento: è un’altra truffa.',
      ],
    },
  },
];
