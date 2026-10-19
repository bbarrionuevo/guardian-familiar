// Capa 1: reglas fijas. Primero se detectan señales sueltas (pide plata, número nuevo,
// urgencia…) y después se combinan: una señal sola rara vez alcanza, la combinación sí.
// Todo trabaja sobre texto normalizado (minúsculas, sin acentos).

import { isSuspicious } from './enlaces';
import type { Finding, Lang, LinkReport } from './tipos';

export type SignalId =
  | 'pide_dinero'
  | 'medio_pago'
  | 'numero_nuevo'
  | 'trato_familiar'
  | 'urgencia'
  | 'amenaza_cuenta'
  | 'codigo'
  | 'pide_codigo'
  | 'no_compartir'
  | 'codigo_por_error'
  | 'pide_datos'
  | 'autoridad'
  | 'se_presenta_entidad'
  | 'retiro_en_casa'
  | 'cambio_billetes'
  | 'cuenta_segura'
  | 'paquete'
  | 'direccion_incompleta'
  | 'cargo_pequeno'
  | 'multa_impuesto'
  | 'ayuda_publica'
  | 'ofrece_dinero'
  | 'inversion'
  | 'inversion_fuerte'
  | 'ganancia_facil'
  | 'trabajo'
  | 'trabajo_fuerte'
  | 'contacto_externo'
  | 'premio'
  | 'regalo_marca'
  | 'encuesta'
  | 'servicio_hogar'
  | 'factura_pendiente'
  | 'adjunto'
  | 'soporte_tecnico'
  | 'acceso_remoto'
  | 'secreto'
  | 'secuestro'
  | 'cobrar_venta'
  | 'sobrepago'
  | 'pago_por_mensajero'
  | 'alquiler'
  | 'romance'
  | 'votacion'
  | 'llamar_numero'
  | 'numero_oficial'
  | 'marca_banco'
  | 'cta_texto'
  | 'cta_enlace'
  | 'enlace'
  | 'enlace_no_oficial'
  | 'enlace_sospechoso';

interface SignalDef {
  id: SignalId;
  // Patrones que valen en cualquier idioma (marcas, siglas) y patrones propios de cada idioma.
  any?: RegExp[];
  it?: RegExp[];
  es?: RegExp[];
}

const SIGNALS: SignalDef[] = [
  {
    id: 'pide_dinero',
    it: [
      /\b(fammi|fai|fare|farmi|mandami|fammi avere) (un |il )?(bonifico|ricarica|versamento)/,
      /\bbonifico (istantaneo|immediato|urgente|su questo|a questo|di)\b/,
      /\b(mi (servono|serve|occorrono)|ci (servono|serve)|ho bisogno di) (subito )?(dei |i |del |un po' di )?(soldi|euro|denaro|\d+)/,
      /\b(serve|servono) (subito )?(del |dei )?(denaro|soldi)\b/,
      /\bbisogno (subito )?di (un |dei )?(bonifico|soldi|ricarica|denaro)/,
      /\b(mi presti|prestami|puoi prestarmi|potresti prestarmi)\b/,
      /\b(puoi|potresti|riesci a) (pagare|pagarmi|fare un bonifico|mandarmi|anticiparmi|ricaricare)/,
      /\b(paga|pagare|versare|saldare|regolarizzare) (subito|ora|entro|oggi|la somma|l'importo|il dovuto|la cauzione|la dogana|l'assicurazione|le spese)/,
      /\b(deve|devi|bisogna|occorre) (pagare|versare|fare un bonifico)/,
      /\b(cauzione|anticipo|caparra|riscatto)\b/,
      /\b(mandami|mandatemi|inviami|trasferisci|trasferire) (tu )?(i |dei )?(soldi|euro|denaro|\d+)/,
    ],
    es: [
      /\b(transferime|transferile|transfiereme|transfiera|hazme|haceme|hacerme|hacer) (una |un |la )?(transferencia|bizum|deposito)/,
      /\b(transferime|transferile|transfiereme|depositame|depositale)\b/,
      /\b(me podes|me puedes|podrias|puede|podes|puedes) (transferir|pasar|prestar|hacer un bizum|depositar|mandar|enviar) /,
      /\b(pasame|mandame|enviame|prestame|depositame) (plata|dinero|\d+|la plata|el dinero|ya)/,
      /\b(necesito|me hace falta|me faltan) (plata|dinero|un adelanto|\d+|que me (pases|transfieras|hagas|deposites|prestes))/,
      /\b(hay que|tiene que|tenes que|debe|necesito que) (pagar|abonar|transferir|depositar|me transfieras|me deposites|me pases)/,
      /\b(abonar|pagar|depositar|transferir|abone|abona|pague) (urgente|ya|hoy|ahora|la suma|el importe|la fianza|la multa|el monto|la deuda)/,
      /\b(fianza|anticipo|adelanto|sena|rescate)\b/,
    ],
  },
  {
    // Nombra un medio de pago (Bizum, alias, IBAN, efectivo, joyas). Por sí solo no es un pedido:
    // «te mandé la plata al alias» también lo dice.
    id: 'medio_pago',
    any: [/\b(iban|cbu|cvu|bizum|postepay|western union|moneygram)\b/, /\b(contanti|efectivo|oro|gioielli|joyas)\b/],
    es: [/\b(al alias|a este alias|a la cuenta|a esta cuenta|al siguiente alias|a nombre de|los datos de la cuenta)\b/],
    it: [/\b(su questo iban|sul seguente iban|intestato a)\b/],
  },
  {
    id: 'numero_nuevo',
    it: [
      /\b(nuovo numero|ho cambiato (il )?numero|cambiato numero|numero nuovo)\b/,
      /\b(salva|memorizza|registra) (questo|il mio|il nuovo) (nuovo )?numero/,
      /\b(questo e il mio|e il mio) (nuovo )?numero/,
      /\b(mi si e|si e|e|mi e) (rotto|caduto|guasto|bagnato) (il )?(telefono|cellulare)/,
      /\b(telefono|cellulare) (rotto|caduto|guasto|in assistenza|nuovo)/,
      /\bperso\b.{0,25}\b(telefono|cellulare)\b/,
    ],
    es: [
      /\b(nuevo numero|numero nuevo|cambie (de |el )?numero|cambie de celu|cambie de movil)\b/,
      /\b(agenda|agendame|agendalo|guarda|guardame|guardalo|anota|apunta) (este|el|mi) (nuevo )?numero/,
      /\b(este es mi|es mi) (nuevo )?numero/,
      /\bse me (rompio|cayo|mojo|perdio) el (celu|celular|movil|telefono)/,
      /\b(celu|celular|movil|telefono) (roto|nuevo|se rompio|se ha roto|en reparacion|en el servicio tecnico)/,
      /\bperdi\b.{0,25}\b(celu|celular|movil|telefono)\b/,
    ],
  },
  {
    id: 'trato_familiar',
    it: [/\b(mamma|mammina|mamy|papa|papi|nonna|nonno|zia|zio|figlio|figlia|tesoro)\b/],
    es: [/\b(mama|mami|mamita|ma|papa|papi|pa|abuela|abuelo|abu|tia|tio|hijo|hija|tesoro)\b/],
  },
  {
    id: 'urgencia',
    it: [
      /\b(urgent[ei]|urgentemente|urgenza|subito|immediatament|entro (oggi|domani|stasera|le ore)|oggi stesso|al piu presto|il prima possibile|ultimo avviso|ultima possibilita|non ho tempo|in fretta|appena puoi|fallo adesso)\b/,
      /\bentro \d+ (ore|giorni|h)\b/,
      /\bscad(e|ra|uto|uta|enza) (oggi|domani|a breve|il)/,
      /\bevitare (ulteriori )?(addebiti|sanzioni|more|interessi|il blocco)/,
    ],
    es: [
      /\b(urgente|urgencia|urgentemente|ya mismo|ahora mismo|inmediat|de inmediato|cuanto antes|lo antes posible|hoy mismo|ultimo aviso|ultima oportunidad|no tengo tiempo|rapido|apurate|apurado|fecha limite)\b/,
      /\ben (las proximas )?(24|48|72) ?(h|horas)\b/,
      /\b(vence|vencen) (hoy|manana|en)\b/,
      /\bevitar (recargos|sanciones|el bloqueo|intereses)/,
      /\bantes de (perderlos|que sea tarde|que venza)/,
    ],
  },
  {
    id: 'amenaza_cuenta',
    it: [
      /\b(conto|carta|account|profilo|utenza|accesso|bancomat|home banking|pratica|posizione|whatsapp)\b.{0,40}\b(bloccat[oa]|sospes[oa]|limitat[oa]|disattivat[oa]|disabilitat[oa])\b/,
      /\b(bloccat[oa]|sospes[oa]|limitat[oa]|disattivat[oa]|disabilitat[oa]|sospensione|blocco)\b.{0,25}\b(conto|carta|account|profilo|utenza|accesso|bancomat|pagamenti)\b/,
      /\banomalia\b.{0,25}\b(conto|carta|account|profilo|accesso)\b/,
      /\b(accesso|attivita|operazione|movimento|disposizione|addebito|transazione|pagamento|bonifico) (anomal[oa]|sospett[oa]|non autorizzat[oa]|insolit[oa]|non riconosciut[oa])/,
      /\btentativ[oi] di accesso\b/,
      /\bse non (lo |la |l')?(riconosce|riconosci|ha (autorizzat|richiest)|hai (autorizzat|richiest))/,
      /\b(conto|carta|account|profilo|utenza|accesso|contatore)\b.{0,40}\b(verra|sara) (chius|bloccat|sospes|disattivat|ridott|limitat)/,
    ],
    es: [
      /\b(cuenta|tarjeta|usuario|perfil|acceso|home ?banking|clave|whatsapp)\b.{0,40}\b(bloquead[oa]|suspendid[oa]|restringid[oa]|desactivad[oa]|inhabilitad[oa])\b/,
      /\b(bloquead[oa]|suspendid[oa]|restringid[oa]|desactivad[oa]|inhabilitad[oa]|bloqueo|suspension)\b.{0,25}\b(cuenta|tarjeta|usuario|perfil|acceso)\b/,
      /\b(acceso|actividad|operacion|movimiento|compra|cargo|transaccion|ingreso|inicio de sesion)e?s? (inusual|sospechos[oa]|no autorizad[oa]|no reconocid[oa]|indebid[oa]|irregular)/,
      /\bintentos? de acceso\b/,
      /\bsi no (la |lo )?(reconoce|reconoces|ha (autorizado|solicitado|realizado)|fuiste vos|fue usted)/,
      /\b(cuenta|tarjeta|usuario|perfil|acceso|servicio|medidor)\b.{0,40}\b(sera|quedara|va a quedar) (bloquead|suspendid|cancelad|desactivad|inhabilitad)/,
    ],
  },
  {
    // Menciona un código (aviso real del banco o pedido de un estafador: se distingue con otras señales).
    id: 'codigo',
    any: [/\b(otp|token)\b/],
    it: [/\bcodic[ei] (di verifica|di sicurezza|di conferma|otp|di accesso|a 6 cifre|di 6 cifre|via sms|per sms)/, /\b(6|sei) cifre\b/],
    es: [
      /\bcodigo (de verificacion|de seguridad|de confirmacion|de acceso|de 6 digitos|por sms|de whatsapp|que te (llego|mande|envie|va a llegar|acaba de llegar))/,
      /\b(6|seis) digitos\b/,
      /\bcodigo\b.{0,20}\b(sms|llegar|llego)\b/,
    ],
  },
  {
    // Pide de forma directa un código, una clave o los datos de la tarjeta.
    id: 'pide_codigo',
    any: [/\b(cvv|cvc)\b/],
    it: [
      /\b(mandami|inviami|dimmi|girami|comunicami|leggimi|dettami|inoltrami|dammi|mi dia|mi dica|mi comunichi|ci comunichi|ci dica) (il |quel |lo |questo |la |le |i )?(codice|codici|pin|password|credenziali|dati della carta|numero della carta)/,
      /\b(me lo|me li) (puoi|potresti|puo|potrebbe) (girare|mandare|inviare|dire|inoltrare)/,
      /\b(ho|abbiamo) bisogno (che mi dia|del (suo|tuo)) (il )?(codice|pin|password)/,
    ],
    es: [
      /\b(mandame|enviame|pasame|pasanos|pasamelo|decime|dime|digame|dictame|dictanos|leeme|reenviame|facilitame|facilite|facilitenos|indiqueme|comuniqueme|dame|deme) (el |ese |este |tu |su |los |las |la )?(codigo|token|clave|claves|pin|contrasena|usuario|datos de (la|tu|su) tarjeta|numero de (la|tu|su) tarjeta)/,
      /\b(necesito|necesitamos) que (me|nos) (pases|des|digas|facilite|facilites|confirmes|confirme|indique|dictes|leas)\b.{0,40}\b(codigo|token|clave|claves|pin|contrasena|usuario|tarjeta)/,
      /\b(ingrese|ingresa|introduzca|introduce|escriba|escribi) (el|su|tu) (codigo|pin|clave|token) (en|aqui|aca)/,
    ],
  },
  {
    // Típico de los avisos reales: «no lo compartas con nadie».
    id: 'no_compartir',
    it: [/\bnon (comunicarlo|condividerlo|darlo|comunicare|condividere) (a nessuno|mai|con nessuno)/, /\bnon (te|ti) lo chiederemo mai|non lo chiederemo mai|non ti chiederemo mai/],
    es: [/\bno (lo|la) (compartas|comparta|compartan|des|de|digas|diga)( a| con)? (nadie|ninguna persona)/, /\bnunca (te|le|les) (lo |la )?(pedira|pediremos|vamos a pedir)/],
  },
  {
    id: 'codigo_por_error',
    it: [/\b(per errore|per sbaglio)\b/, /\bti (e arrivato|e stato inviato|ho mandato|ho inviato) (un|il) codice/],
    es: [/\bpor (error|equivocacion)\b/, /\bsin querer\b/, /\bte (llego|mande|envie) (un|el) codigo/, /\b(me lo|me) (podes|puedes|podrias) (reenviar|pasar|mandar)/],
  },
  {
    id: 'pide_datos',
    it: [
      /\b(verific|conferm|aggiorn|inseri|complet|modific)\w* (i |il |la |le |l')?(tuoi |suoi |propri )?(dati|indirizzo|procedura|verifica|identita|modulo|profilo|credenziali)/,
      /\binserendo (la targa|i dati|il codice fiscale)/,
      /\bcaricando (il |un )?(documento|selfie|busta paga)/,
    ],
    es: [
      /\b(verifi|confirm|actualiz|actualic|valid|complet|ingres|introduc|introduzc|carg)\w* (sus |tus |los |la |su |tu |el |mis )?(datos|direccion|domicilio|identidad|informacion|formulario|documentacion)\b/,
      /\brellen\w* (el )?formulario/,
      /\bfoto (de|del) (su |tu )?(dni|documento|carnet|cara|tarjeta)/,
      /\bverificacion de seguridad\b/,
    ],
  },
  {
    id: 'autoridad',
    it: [/\b(carabinier[ei]|polizia|poliziotto|questura|maresciallo|commissariato|avvocat[oaie]|tribunale|magistrat\w*|guardia di finanza|caserma|arrestat[oaie]|ferm(o|at[oa]) dalla|ospedale|pronto soccorso|incidente|investit[oa])\b/],
    es: [/\b(policia|guardia civil|comisaria|fiscal|fiscalia|abogad[oa]s?|juzgado|juez|jueza|hospital|guardia medica|accidente|choque|atropell\w*|detenid[oa]s?|arrestad[oa]s?|demorad[oa]s?|preso|presa|mossos|gendarmeria|prefectura|incidente)\b/],
  },
  {
    // Alguien se presenta como empleado de una empresa o un organismo («la llamo del banco»).
    id: 'se_presenta_entidad',
    it: [/\b(la|ti|vi) (chiamo|chiamiamo|contatto|contattiamo|scrivo|scriviamo) (da|dalla|dal|dall'|per conto)/, /\bsono (un|una|il|la) (operatore|operatrice|dipendente|funzionari\w*|impiegat\w*|tecnico|consulente)\b/],
    es: [/\b(la|lo|le|te|los) (llamo|llamamos|hablo|hablamos|escribo|escribimos|contacto|contactamos) (de|del|desde) /, /\bsoy (el |la )?(operador|operadora|asesor|asesora|empleado|empleada|agente|tecnico) de/],
  },
  {
    // Alguien va a pasar por la casa a buscar plata, dólares, joyas o tarjetas.
    id: 'retiro_en_casa',
    it: [/\b(verra|mandiamo|mandero|passera|arrivera|manderemo) (da lei |da te |a casa )?(una persona|un (nostro )?(incaricato|collega|corriere|addetto)|qualcuno)/, /\b(a casa|da lei|da te) a ritirar/],
    es: [
      /\b(mandamos|enviamos|le mandamos|te mandamos|va a pasar|pasara) (un |una |a )?(cadete|mensajero|motoquero|empleado|persona|alguien|retirar|buscar)/,
      /\b(a su casa|a tu casa|por su casa|por tu casa) (a |para )?(retirar|buscar|recoger)/,
      /\bpara retirar(los|las|lo|la)\b/,
    ],
  },
  {
    id: 'cambio_billetes',
    it: [/\b(banconote (vecchie|fuori corso|false|da cambiare)|cambiare le (sue |tue )?banconote)\b/],
    es: [/\b(serie vieja|billetes viejos|cara chica|cambiar (sus|tus|los) (billetes|dolares|euros)|perder (su )?valor)\b/],
  },
  {
    id: 'cuenta_segura',
    it: [/\bconto (sicuro|protetto|di sicurezza|temporaneo|di appoggio|di transito)\b/, /\bmettere al sicuro (i |il |tuoi |suoi )?(soldi|risparmi|denaro)/, /\bspostare (i |il )?(soldi|risparmi|denaro|saldo)/],
    es: [/\bcuenta (segura|de seguridad|protegida|temporal|puente|de resguardo)\b/, /\b(poner a salvo|resguardar|proteger|mover) (tu |su |el )?(dinero|plata|ahorros|saldo)/],
  },
  {
    id: 'paquete',
    any: [/\b(brt|gls|dhl|sda|fedex|seur|mrw|andreani|inpost|correos)\b/, /\b(correo argentino|poste italiane|argentina post)\b/],
    it: [/\b(pacco|pacchetto|spedizione|consegna|corriere|giacenza|dogana|sdoganamento|tracking|postino)\b/],
    es: [/\b(paquete|envio|entrega|repartidor|aduana|aduanas|retenid[oa]|seguimiento)\b/],
  },
  {
    id: 'direccion_incompleta',
    it: [/\bindirizzo (non valido|incompleto|errato|non corretto|non trovato)/],
    es: [/\b(direccion|domicilio) (esta |es )?(incompleta|incorrecta|erronea|no valida)/, /\bfalta (un |el )?(numero de (calle|portal|piso)|dato)/],
  },
  {
    // Montos chicos (1,99 €) típicos de los falsos gastos de envío.
    id: 'cargo_pequeno',
    any: [/(?:€|eur|euro|ars|\$)\s?[0-4][.,]\d{2}(?!\d)/, /(?<![\d.,])[0-4][.,]\d{2}\s?(?:€|eur|euro)(?![a-z])/],
    it: [/\b(spese di (spedizione|consegna|sdoganamento|giacenza|riconsegna)|tassa doganale|dazi|costi di spedizione)\b/],
    es: [/\b(gastos de (envio|aduana|gestion|entrega)|tasa (de aduana|aduanera)|tasas|arancel|costo de envio|solo pagas el envio)\b/],
  },
  {
    id: 'multa_impuesto',
    any: [/\b(pagopa|telepass|dgt|aeat|arca|afip|vtv|zbe|irpef)\b/],
    it: [/\b(agenzia (delle )?entrate|rimborso|multa|sanzione|verbale|contravvenzione|pedaggi?|autostrad\w*|bollo auto|riscossione|cartella esattoriale)\b/],
    es: [/\b(agencia tributaria|hacienda|devolucion|reembolso|multa|sancion|peaje|deuda|embargo|infraccion)\b/],
  },
  {
    id: 'ayuda_publica',
    any: [/\b(inps|anses|pami|sepe)\b/],
    it: [/\b(bonus|naspi|assegno (unico|sociale)|pensione|indennita|reddito di|erogazione)\b/],
    es: [/\b(seguridad social|jubilacion|jubilad[oa]s?|pension|ingreso minimo|bono|subsidio|asignacion|prestacion|ayuda (economica|social|estatal))\b/],
  },
  {
    // Promete que le van a dar o devolver plata (bono, reembolso, cupón con monto).
    id: 'ofrece_dinero',
    it: [/\b(erogazione|accredito|rimborso|bonus|buon[oi]) (di|da) (€ ?)?\d/],
    es: [/\b(reembolso|devolucion|bono|subsidio|beneficio|cupon|cupones|vale|vales) (de|del|por) (\$ ?|€ ?)?\d/],
  },
  {
    id: 'inversion',
    any: [/\b(trading|forex|bitcoin|cripto|crypto|usdt|binance)\b/],
    it: [/\b(investiment|investire|rendiment|piattaforma|consulente finanziario|deposito di)/],
    es: [/\b(inversion|invertir|rendimiento|plataforma|asesor financiero)/],
  },
  {
    id: 'inversion_fuerte',
    any: [/\b\d{2,3} ?% (al mese|mensile|al giorno|giornalier|settimanal|mensual|al mes|diari|por dia|semanal)/],
    it: [
      /\b(guadagn[oi]|rendiment[oi]|reddito) (garantit|sicur|assicurat|certo)/,
      /\bsenza (alcun )?rischi/,
      /\braddoppia/,
      /\b(guadagna|guadagnare) (fino a|oltre|piu di) \d/,
      /\b(guadagn\w*|otten\w*|reddito)\b.{0,30}\d[\d.]* ?(euro|€) (al mese|mensili|al giorno)/,
      /\bautorizzat\w* dallo stato\b/,
    ],
    es: [
      /\b(ganancias?|rendimientos?|retornos?) (garantizad|asegurad|segur)/,
      /\bsin (ningun )?riesgo/,
      /\bduplica(r|s|mos|ras)\b/,
      /\b(gana|ganar|ganaras) (hasta|mas de|entre) \d/,
      /\b(ganar|gana\w*|obten\w*)\b.{0,30}\d[\d.]* ?(euros?|€|dolares|usd|pesos) (al mes|mensuales|por mes|al dia|diarios)/,
      /\b(respaldad|avalad|autorizad)\w* por (el gobierno|el banco de espana|el banco central|la cnmv|el bcra)/,
    ],
  },
  {
    id: 'ganancia_facil',
    it: [/\bguadagna\w* (soldi|denaro) (da casa|facilmente|senza)/, /\bguadagnare molto di piu\b/],
    es: [/\b(empeza|empieza|comienza|comenza)\w* a ganar\b/, /\bganar (plata|dinero) (desde (tu |su )?casa|facil)/],
  },
  {
    id: 'trabajo',
    it: [/\b(lavoro|offerta di lavoro|opportunita di lavoro|collaborazione|part[ -]?time|da casa|selezionat[oa] per|curriculum|selezione|colloquio|candidatura)\b/],
    es: [/\b(trabajo|empleo|oferta laboral|oportunidad laboral|medio tiempo|part[ -]?time|desde casa|desde tu casa|seleccionad[oa] para|curriculum|postulacion|entrevista)\b/],
  },
  {
    id: 'trabajo_fuerte',
    it: [
      /\b(mettere|metti|mettete) ['"«]?(mi piace|like)/,
      /\b(recensioni|valutazioni|missioni|compiti (semplici|online))\b/,
      /\b(completa|completare|sbloccare) (i )?compiti\b/,
      /\b(guadagn\w*|paga|pagat[oa]) (da )?\d+ ?(€|euro) (al giorno|per (ogni|compito|like|video))/,
      /\b\d+ ?(€|euro) (al giorno|giornalieri)\b/,
    ],
    es: [
      /\b(dar|darle|des|da) ['"«]?(me gusta|like)/,
      /\b(likes|resenas|valoraciones|tareas (simples|sencillas|faciles|online|diarias))\b/,
      /\bte pagamos por (cada |dar |ver )?(video|like|me gusta|resena|tarea)/,
      /\b(completar|desbloquear) (las )?tareas\b/,
      /\bsistema de recompensas\b/,
      /\b(gana\w*|pago|pagamos|cobras) \d+ ?(€|euros|dolares|pesos|usd|\$) (por dia|diarios|al dia|por (cada|tarea|like|video))/,
      /\b\d+ ?(€|euros|dolares|usd) (por dia|diarios|al dia)\b/,
    ],
  },
  {
    // Pide seguir la conversación en otro número de WhatsApp o en Telegram.
    id: 'contacto_externo',
    it: [/\b(aggiung\w*|scriv\w*|contatt\w*|salv\w*)\b.{0,40}\b(whatsapp|telegram)\b/],
    es: [/\b(agreg\w*|anad\w*|escrib\w*|contact\w*|agend\w*)\b.{0,40}\b(whatsapp|telegram)\b/],
  },
  {
    id: 'premio',
    any: [/\bgift ?card\b/],
    it: [/\b(hai vinto|ha vinto|sei (stat[oa] )?(selezionat|estratt|scelt)\w*|vincitor\w*|premio|buon[oi] (spesa|regalo|da \d)|omaggio|in regalo|congratulazioni|punti (in scadenza|scadono)|riscatta (i )?(tuoi )?punti)\b/],
    es: [/\b(has ganado|ganaste|salio ganador[a]?|resulto ganador[a]?|ganador[a]?|sorteo|premio|cupon(es)? (de|por) \d|vale (de|por) \d|tarjeta regalo|bono de \d|canje\w* (tus |sus )?puntos|puntos (por vencer|vencen)|(tus|sus) puntos)\b/],
  },
  {
    // «Mercadona regala cupones de 500 €»: cadenas falsas de regalos de supermercados.
    id: 'regalo_marca',
    it: [/\b(regala|regalano|regaliamo|sta regalando)\b.{0,25}\b(buon[oi]|carte? regalo|gift|\d)/],
    es: [/\b(regala|regalan|regalando|regalamos)\b.{0,25}\b(cupon\w*|bonos?|vales?|tarjetas?|gift|\d)/],
  },
  {
    id: 'encuesta',
    it: [/\b(questionario|sondaggio|rispondi (al|alle|a) (breve )?(questionario|domande))\b/],
    es: [/\b(encuesta|cuestionario|responde (a )?(unas|estas|las) preguntas)\b/],
  },
  {
    id: 'servicio_hogar',
    any: [/\b(enel|endesa|iberdrola|naturgy|edenor|edesur|metrogas|a2a|hera|acea|eni plenitude)\b/],
    it: [/\b(bolletta|fornitura|distacco|interruzione (della )?(fornitura|luce|gas)|sospensione (della )?(fornitura|luce|gas)|contatore)\b/],
    es: [/\b(factura (de|del) (luz|gas|agua)|corte (de|del) (luz|gas|agua|suministro|servicio)|suministro|medidor|contador de (luz|gas))\b/],
  },
  {
    id: 'factura_pendiente',
    it: [/\b(bollett[ae]|fattur[ae]) (non pagat|scadut|insolut)/, /\bmancato pagamento\b/],
    es: [/\b(factura|recibo)s? (vencid|impagad|pendiente)/, /\bpendiente de pago\b/],
  },
  {
    id: 'adjunto',
    it: [/\b(scarica (l'allegato|la fattura|il documento)|apri l'allegato|in allegato|allegat[oa])\b/],
    es: [/\b(adjunt[oa]|archivo adjunto|descargue (el|la) (archivo|factura|documento))\b/],
  },
  {
    id: 'soporte_tecnico',
    any: [/\b(microsoft|windows defender|norton|mcafee|avast|security warning)\b/],
    it: [/\b(virus|infettat[oa]|malware|spyware|hacker|supporto tecnico|assistenza tecnica|dispositivo (compromesso|infetto)|computer (e stato )?bloccato)\b/],
    es: [/\b(virus|infectad[oa]|malware|spyware|hacker|soporte tecnico|asistencia tecnica|dispositivo (comprometido|infectado)|problema grave en su (ordenador|computadora|equipo|pc))\b/],
  },
  {
    id: 'acceso_remoto',
    any: [/\b(anydesk|teamviewer|quicksupport|rustdesk|ultraviewer)\b/],
    it: [/\baccesso remoto\b/, /\b(scarica|installa|installare|installi|scarichi|scaricare) (questa |l'|un'|una |un )?(app|applicazione|programma)/, /\bdevo (accedere|collegarmi) al (suo|tuo) (computer|pc|telefono)/],
    es: [
      /\bacceso remoto\b/,
      /\b(descarga|descargue|instala|instale|instalar) (esta |la |una )?(app|aplicacion|programa)/,
      /\b(necesito|necesitamos|debo|tengo que) (acceder|entrar|conectarme) (a|al) (el|su|tu|ordenador|computadora|equipo|pc|celular|telefono|movil)/,
    ],
  },
  {
    id: 'secreto',
    it: [/\bnon (dirlo|dire niente|dire nulla) a nessuno\b/, /\bnon (chiamare|telefonare|avvisare) (nessuno|la polizia|i carabinieri|la banca)/, /\bnon riattaccare\b/, /\bresta in linea\b/, /\be (riservat|confidenzial)/],
    es: [/\bno (se )?lo (digas|diga|cuentes|cuente) a nadie\b/, /\bno (le )?(digas|diga|avises|avise) (nada|a nadie)/, /\bno (llames|llame|cuelgues|cuelgue|cortes|corte)\b/, /\b(quedate|quedese) en linea\b/, /\bes (confidencial|secreto)\b/],
  },
  {
    id: 'secuestro',
    it: [/\b(rapit[oa]|rapimento|sequestrat[oa]|abbiamo (tuo|tua|vostro|vostra|suo|sua)|se chiami la polizia|se non paghi)\b/],
    es: [/\b(secuestr\w*|tenemos a (tu|su)|si (llamas|llama) a la policia|si (cortas|corta) lo (matamos|lastimamos)|nos llevamos a|encerrad[oa]s|encapuchad[oa]s)\b/, /\bsi no (pagas|paga)\b/],
  },
  {
    id: 'cobrar_venta',
    any: [/\b(subito\.it|vinted|wallapop|marketplace|mercado libre|milanuncios)\b/],
    it: [/\b(ricevere|incassare|riscuotere) (il |l')?(pagamento|denaro|importo|soldi)/, /\bho (gia )?(pagato|effettuato il pagamento)\b/, /\bricevuta di pagamento\b/, /\b(il tuo|il suo) (articolo|oggetto) (e stato )?vendut/],
    es: [
      /\b(recibir|cobrar|recibe|cobra) (el |tu |su )?(pago|dinero|importe|plata)/,
      /\b(ya )?(te|le) (he )?(hice|envie|mande|pague|pagado|transferi) (la transferencia|el pago|el comprobante|la sena|el articulo|por mercado pago)/,
      /\bcomprobante\b/,
      /\b(tu|su) (articulo|producto) (ya )?(se ha|ha sido|fue) vendid/,
    ],
  },
  {
    id: 'sobrepago',
    it: [/\bti ho (mandato|inviato|pagato|trasferito) (di piu|troppo)/, /\brestituisci\w* la differenza\b/],
    es: [/\b(me equivoque|por error|sin querer) y te (mande|transferi|pague|deposite)/, /\b(devolveme|devuelveme|devuelvame|me devolves|me devuelves) la diferencia\b/],
  },
  {
    id: 'pago_por_mensajero',
    it: [/\b(tramite|con) (il )?corriere\b.{0,60}\b(denaro|soldi|pagamento|contanti)/, /\briceverai un (messaggio|sms|email|e-mail) dalla (compagnia|societa) di (spedizion|trasport)/],
    es: [/\b(te|le) (pago|pagare|pagaremos) (por|a traves de|con) (el )?(correo|mensajero|empresa de envios|transportista)/],
  },
  {
    id: 'alquiler',
    it: [/\b(affitto|affitta|affittasi|casa vacanze|appartamento|prenotare|prenotazione)\b/],
    es: [/\b(alquilo|alquiler|alquila|para reservar\w*|reserva\w* con|temporada|depto|departamento|cabana)\b/],
  },
  {
    id: 'romance',
    it: [/\b(raggiungerti|venire da te|conoscerti di persona|amore mio|tesoro mio|in missione|militare|marines|piattaforma petrolifera)\b/],
    es: [/\b(mi amor|amor mio|vida mia|conocerte en persona|visitarte|cuando nos (veamos|conozcamos)|en mision|soldado|marines|plataforma petrolera|que la hagamos juntos)\b/],
  },
  {
    id: 'votacion',
    it: [/\b(vota|votate|votare|votami|votala|votalo) per\b/, /\b(puoi|potresti) votare\b/],
    es: [/\b(vota|votar|votame|votala|votalo|vote|votes) por\b/, /\b(podrias|puedes|podes|podria) votar\b/],
  },
  {
    // Pide llamar a un número que viene en el mismo mensaje.
    id: 'llamar_numero',
    it: [/\b(chiama|chiami|chiamare|contatta|contatti|contattare|richiama|richiami)\b.{0,40}(\bnumero\b|\bal \d|\[numero\]|\+\d)/, /\bun (nostro )?operatore ti (chiamera|contattera)/],
    es: [/\b(llame|llama|llamar|comuniquese|comunicate|contacte|contacta|marque|marca)\b.{0,40}(\bnumero\b|\bal \d|\[numero\]|\+\d|\blinea\b)/, /\bun (operador|asesor|agente) (lo|la|te) (llamara|contactara|va a llamar)/],
  },
  {
    // «Llame al número que figura en su tarjeta»: así hablan los avisos reales.
    id: 'numero_oficial',
    it: [/\bnumero (scritto |indicato )?(sul|nel) retro\b/, /\bnumero (scritto |indicato )?sulla (carta|bolletta)\b/, /\bdall'app ufficiale\b/],
    es: [/\b(numero|telefono) (que (figura|aparece) )?(en|de|del) (la )?(parte (trasera|posterior)|dorso|reverso)\b/, /\bnumero que figura en (su|tu) (factura|tarjeta)\b/, /\bdesde la app oficial\b/],
  },
  {
    id: 'marca_banco',
    any: [/\b(intesa|sanpaolo|unicredit|bper|bancoposta|fineco|mediolanum|bnl|credem|bbva|santander|caixabank|caixa|sabadell|unicaja|bankinter|kutxabank|abanca|galicia|macro|banco nacion|banco provincia|mercado pago|uala|brubank|naranja x|paypal|visa|mastercard|amex|iosicuro)\b/],
    it: [/\b(banca|carta di credito|carta di debito|bancomat|conto corrente|home banking|suo conto|tuo conto)\b/],
    es: [/\b(banco|tarjeta de (credito|debito)|cuenta bancaria|home ?banking|banca (online|movil))\b/],
  },
  {
    // Invita a tocar un enlace («pincha aquí», «al seguente link»). [enlace] y [link] son enlaces quitados por la fuente.
    id: 'cta_texto',
    it: [/\b(al seguente (link|indirizzo|collegamento)|seguente link|a questo link|tramite (il|questo) link|nel link|link (qui|qua|sotto|in basso)|clicca\w*|clicchi|tocca qui|accedi qui|acceda (al|qui)|basta un click|registrati (qui|al link))\b/, /\[link\]/],
    es: [
      /\b(en (este|el siguiente|el) (enlace|link)|siguiente (enlace|link)|pinche|pincha|pinchar|pulse aqui|pulsa aqui|haga clic|hace clic|haz clic|clic aqui|click aqui|clic aca|click aca|toca aqui|toque aqui|toca aca|ingrese aqui|ingresa aqui|ingresa aca|entre aqui|entra aqui|acceda aqui|accede aqui|registrate (aqui|aca|en|para|seleccionando)|letras azules)\b/,
      /\[enlace\]/,
    ],
  },
];

export interface DetectedSignals {
  ids: Set<SignalId>;
  evidence: Map<SignalId, string>;
}

// Señales que no se prueban con la lista del otro idioma: «ma» es «pero» en italiano.
const AMBIGUOUS = new Set<SignalId>(['trato_familiar']);

export function detectSignals(text: string, lang: Lang, links: LinkReport[]): DetectedSignals {
  const ids = new Set<SignalId>();
  const evidence = new Map<SignalId, string>();
  for (const def of SIGNALS) {
    // Se prueban los patrones del idioma detectado y, por las dudas, los del otro:
    // un mensaje puede mezclar idiomas.
    const other = AMBIGUOUS.has(def.id) ? [] : ((lang === 'it' ? def.es : def.it) ?? []);
    const patterns = [...(def.any ?? []), ...(def[lang] ?? []), ...other];
    for (const re of patterns) {
      const m = re.exec(text);
      if (m) {
        ids.add(def.id);
        evidence.set(def.id, m[0]);
        break;
      }
    }
  }
  // Si el mensaje manda al número de la tarjeta o de la factura, «llame» no es una señal.
  if (ids.has('numero_oficial')) ids.delete('llamar_numero');

  if (links.length > 0) ids.add('enlace');
  if (links.some((l) => !l.official)) ids.add('enlace_no_oficial');
  // Invitar a un enlace cuenta si el enlace no es oficial o si no vino (lo quitó quien reenvió).
  if (ids.has('cta_texto') && (links.length === 0 || links.some((l) => !l.official))) ids.add('cta_enlace');
  const suspicious = links.find(isSuspicious);
  if (suspicious) {
    ids.add('enlace_sospechoso');
    evidence.set('enlace_sospechoso', suspicious.host);
  }
  return { ids, evidence };
}

interface Combo {
  pattern: Finding['pattern'];
  level: Finding['level'];
  when: (s: Set<SignalId>) => boolean;
  uses: SignalId[];
}

const has = (s: Set<SignalId>, ...ids: SignalId[]) => ids.every((id) => s.has(id));
const any = (s: Set<SignalId>, ...ids: SignalId[]) => ids.some((id) => s.has(id));

// Lleva a actuar por un canal que puso el remitente: su enlace, su número, darle datos o plata.
const pushesToAct = (s: Set<SignalId>) =>
  any(s, 'enlace_no_oficial', 'cta_enlace', 'llamar_numero', 'pide_codigo', 'pide_datos', 'pide_dinero', 'medio_pago', 'acceso_remoto');

const COMBOS: Combo[] = [
  { pattern: 'secuestro_virtual', level: 'alto', when: (s) => s.has('secuestro'), uses: ['secuestro'] },

  { pattern: 'familiar_numero_nuevo', level: 'alto', when: (s) => s.has('numero_nuevo') && any(s, 'trato_familiar', 'pide_dinero', 'medio_pago', 'urgencia'), uses: ['numero_nuevo', 'trato_familiar', 'pide_dinero', 'urgencia'] },
  { pattern: 'familiar_numero_nuevo', level: 'medio', when: (s) => s.has('numero_nuevo'), uses: ['numero_nuevo'] },

  { pattern: 'falso_agente', level: 'alto', when: (s) => s.has('autoridad') && any(s, 'pide_dinero', 'medio_pago', 'secreto', 'retiro_en_casa') && !s.has('multa_impuesto'), uses: ['autoridad', 'pide_dinero', 'secreto', 'retiro_en_casa'] },
  { pattern: 'falso_agente', level: 'alto', when: (s) => has(s, 'autoridad', 'trato_familiar', 'urgencia'), uses: ['autoridad', 'trato_familiar', 'urgencia'] },
  { pattern: 'falso_agente', level: 'medio', when: (s) => s.has('autoridad') && any(s, 'trato_familiar', 'urgencia'), uses: ['autoridad', 'trato_familiar', 'urgencia'] },

  { pattern: 'retiro_domicilio', level: 'alto', when: (s) => s.has('retiro_en_casa') && any(s, 'pide_dinero', 'medio_pago', 'autoridad', 'trato_familiar', 'cambio_billetes', 'se_presenta_entidad', 'marca_banco', 'urgencia'), uses: ['retiro_en_casa', 'cambio_billetes', 'se_presenta_entidad'] },
  { pattern: 'retiro_domicilio', level: 'medio', when: (s) => any(s, 'retiro_en_casa', 'cambio_billetes'), uses: ['retiro_en_casa', 'cambio_billetes'] },

  { pattern: 'cuenta_segura', level: 'alto', when: (s) => s.has('cuenta_segura'), uses: ['cuenta_segura'] },

  { pattern: 'codigo_verificacion', level: 'alto', when: (s) => s.has('pide_codigo') && any(s, 'codigo', 'urgencia', 'marca_banco', 'amenaza_cuenta', 'codigo_por_error', 'enlace_no_oficial', 'cta_enlace', 'llamar_numero', 'premio', 'trato_familiar', 'se_presenta_entidad', 'pide_datos'), uses: ['pide_codigo', 'codigo', 'se_presenta_entidad'] },
  { pattern: 'codigo_verificacion', level: 'alto', when: (s) => has(s, 'codigo', 'codigo_por_error'), uses: ['codigo', 'codigo_por_error'] },
  { pattern: 'codigo_verificacion', level: 'medio', when: (s) => s.has('pide_codigo') || (has(s, 'codigo', 'urgencia') && !s.has('no_compartir')), uses: ['pide_codigo', 'codigo'] },

  { pattern: 'votacion_falsa', level: 'alto', when: (s) => s.has('votacion') && any(s, 'enlace', 'cta_enlace', 'codigo', 'pide_codigo'), uses: ['votacion', 'cta_enlace'] },
  { pattern: 'votacion_falsa', level: 'medio', when: (s) => s.has('votacion'), uses: ['votacion'] },

  { pattern: 'banco_falso', level: 'alto', when: (s) => s.has('amenaza_cuenta') && pushesToAct(s), uses: ['amenaza_cuenta', 'cta_enlace', 'llamar_numero', 'pide_datos'] },
  { pattern: 'banco_falso', level: 'alto', when: (s) => s.has('marca_banco') && (s.has('enlace_sospechoso') || (s.has('pide_datos') && any(s, 'cta_enlace', 'llamar_numero', 'enlace_no_oficial'))), uses: ['marca_banco', 'enlace_sospechoso', 'pide_datos'] },
  { pattern: 'banco_falso', level: 'medio', when: (s) => s.has('amenaza_cuenta') || (s.has('marca_banco') && any(s, 'pide_datos', 'cta_enlace')), uses: ['amenaza_cuenta', 'marca_banco', 'pide_datos'] },

  { pattern: 'inversion_falsa', level: 'alto', when: (s) => s.has('inversion_fuerte') || (s.has('inversion') && any(s, 'ganancia_facil', 'pide_dinero')), uses: ['inversion_fuerte', 'inversion', 'ganancia_facil'] },
  { pattern: 'inversion_falsa', level: 'medio', when: (s) => s.has('inversion') && any(s, 'enlace_no_oficial', 'cta_enlace', 'urgencia', 'contacto_externo'), uses: ['inversion'] },

  { pattern: 'romance_falso', level: 'alto', when: (s) => s.has('romance') && any(s, 'pide_dinero', 'medio_pago', 'paquete', 'cargo_pequeno'), uses: ['romance', 'pide_dinero'] },

  { pattern: 'paquete_falso', level: 'alto', when: (s) => s.has('paquete') && any(s, 'cargo_pequeno', 'enlace_no_oficial', 'cta_enlace', 'pide_dinero', 'medio_pago', 'pide_datos'), uses: ['paquete', 'cargo_pequeno', 'cta_enlace', 'pide_datos'] },
  { pattern: 'paquete_falso', level: 'medio', when: (s) => s.has('paquete') && any(s, 'urgencia', 'llamar_numero', 'direccion_incompleta'), uses: ['paquete', 'urgencia', 'direccion_incompleta'] },

  { pattern: 'multa_impuesto_falso', level: 'alto', when: (s) => s.has('multa_impuesto') && any(s, 'enlace_no_oficial', 'cta_enlace', 'pide_codigo', 'pide_datos'), uses: ['multa_impuesto', 'cta_enlace', 'pide_datos'] },
  { pattern: 'multa_impuesto_falso', level: 'medio', when: (s) => s.has('multa_impuesto') && any(s, 'urgencia', 'pide_dinero', 'llamar_numero', 'ofrece_dinero'), uses: ['multa_impuesto', 'urgencia'] },

  { pattern: 'ayuda_publica_falsa', level: 'alto', when: (s) => s.has('ayuda_publica') && any(s, 'enlace_no_oficial', 'cta_enlace', 'pide_codigo', 'pide_datos'), uses: ['ayuda_publica', 'cta_enlace', 'pide_datos'] },
  { pattern: 'ayuda_publica_falsa', level: 'medio', when: (s) => s.has('ayuda_publica') && any(s, 'pide_dinero', 'urgencia', 'llamar_numero', 'amenaza_cuenta', 'ofrece_dinero'), uses: ['ayuda_publica', 'ofrece_dinero'] },

  { pattern: 'servicio_corte_falso', level: 'alto', when: (s) => s.has('servicio_hogar') && (any(s, 'enlace_no_oficial', 'cta_enlace', 'pide_codigo', 'pide_datos') || (any(s, 'pide_dinero', 'medio_pago') && any(s, 'urgencia', 'factura_pendiente'))), uses: ['servicio_hogar', 'cta_enlace', 'pide_dinero'] },
  { pattern: 'servicio_corte_falso', level: 'medio', when: (s) => s.has('servicio_hogar') && any(s, 'urgencia', 'amenaza_cuenta', 'llamar_numero', 'pide_dinero', 'factura_pendiente'), uses: ['servicio_hogar', 'urgencia'] },

  { pattern: 'premio_falso', level: 'alto', when: (s) => s.has('regalo_marca') || (s.has('premio') && any(s, 'enlace_no_oficial', 'cta_enlace', 'pide_dinero', 'medio_pago', 'pide_codigo', 'pide_datos', 'cargo_pequeno', 'encuesta', 'acceso_remoto')), uses: ['regalo_marca', 'premio', 'cta_enlace', 'pide_datos'] },
  { pattern: 'premio_falso', level: 'medio', when: (s) => s.has('premio') && any(s, 'urgencia', 'llamar_numero', 'ofrece_dinero', 'se_presenta_entidad'), uses: ['premio'] },

  { pattern: 'trabajo_falso', level: 'alto', when: (s) => s.has('trabajo_fuerte') || (s.has('trabajo') && any(s, 'contacto_externo', 'ganancia_facil', 'pide_dinero')), uses: ['trabajo_fuerte', 'trabajo', 'contacto_externo'] },
  { pattern: 'trabajo_falso', level: 'medio', when: (s) => s.has('trabajo') && any(s, 'enlace_no_oficial', 'cta_enlace', 'premio', 'inversion'), uses: ['trabajo'] },

  { pattern: 'compraventa_falsa', level: 'alto', when: (s) => any(s, 'sobrepago', 'pago_por_mensajero') || (s.has('cobrar_venta') && any(s, 'enlace_no_oficial', 'cta_enlace', 'pide_codigo', 'pide_datos', 'cargo_pequeno', 'pide_dinero')), uses: ['sobrepago', 'pago_por_mensajero', 'cobrar_venta', 'cta_enlace'] },
  // «Ya te pagué, te mando el comprobante»: puede ser verdad, pero conviene mirar la app antes de entregar.
  { pattern: 'compraventa_falsa', level: 'medio', when: (s) => s.has('cobrar_venta') || has(s, 'alquiler', 'pide_dinero'), uses: ['cobrar_venta', 'alquiler', 'pide_dinero'] },

  { pattern: 'soporte_tecnico_falso', level: 'alto', when: (s) => any(s, 'soporte_tecnico', 'acceso_remoto') && any(s, 'acceso_remoto', 'llamar_numero', 'pide_dinero', 'pide_codigo', 'enlace_no_oficial', 'cta_enlace', 'se_presenta_entidad'), uses: ['soporte_tecnico', 'acceso_remoto', 'llamar_numero'] },
  { pattern: 'soporte_tecnico_falso', level: 'medio', when: (s) => s.has('soporte_tecnico') && any(s, 'urgencia', 'amenaza_cuenta'), uses: ['soporte_tecnico'] },

  { pattern: 'archivo_adjunto', level: 'alto', when: (s) => s.has('adjunto') && any(s, 'factura_pendiente', 'urgencia', 'amenaza_cuenta', 'multa_impuesto'), uses: ['adjunto', 'factura_pendiente'] },

  { pattern: 'pedido_dinero', level: 'alto', when: (s) => any(s, 'pide_dinero', 'medio_pago') && (s.has('secreto') || has(s, 'trato_familiar', 'urgencia')), uses: ['pide_dinero', 'secreto', 'trato_familiar', 'urgencia'] },
  { pattern: 'pedido_dinero', level: 'medio', when: (s) => s.has('pide_dinero'), uses: ['pide_dinero'] },

  { pattern: 'enlace_sospechoso', level: 'alto', when: (s) => s.has('enlace_sospechoso') && any(s, 'urgencia', 'amenaza_cuenta', 'pide_codigo', 'pide_datos', 'pide_dinero', 'medio_pago', 'paquete', 'premio', 'multa_impuesto', 'ayuda_publica', 'servicio_hogar', 'cargo_pequeno'), uses: ['enlace_sospechoso'] },
  { pattern: 'enlace_sospechoso', level: 'alto', when: (s) => s.has('cta_enlace') && any(s, 'urgencia', 'amenaza_cuenta', 'pide_datos'), uses: ['cta_enlace', 'urgencia', 'pide_datos'] },
  { pattern: 'enlace_sospechoso', level: 'medio', when: (s) => any(s, 'enlace_sospechoso', 'cta_enlace'), uses: ['enlace_sospechoso', 'cta_enlace'] },

  { pattern: 'otro', level: 'medio', when: (s) => s.has('contacto_externo'), uses: ['contacto_externo'] },
];

export function evaluateRules(signals: DetectedSignals): Finding[] {
  const findings: Finding[] = [];
  const seen = new Set<string>();
  for (const combo of COMBOS) {
    if (!combo.when(signals.ids)) continue;
    // De cada patrón queda solo el nivel más alto (los combos «alto» van antes que los «medio»).
    if (seen.has(combo.pattern)) continue;
    seen.add(combo.pattern);
    findings.push({
      pattern: combo.pattern,
      level: combo.level,
      signals: combo.uses.filter((id) => signals.ids.has(id)).map((id) => `${id}: ${signals.evidence.get(id) ?? '✓'}`),
    });
  }
  return findings;
}

// Exportado para las pruebas.
export const _internals = { AMBIGUOUS, SIGNALS };
