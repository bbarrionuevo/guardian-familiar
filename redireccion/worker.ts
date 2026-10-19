// La primera dirección del sitio, guardian-familiar.<cuenta>.workers.dev. Desde el cambio de nombre
// a Pausa solo redirige a la nueva, con la misma ruta, para que no se rompan los enlaces ya
// compartidos ni lo que Google haya visto.

export interface Env {
  DESTINO?: string;
}

export default {
  fetch(request: Request, env: Env): Response {
    const url = new URL(request.url);
    const destino = (env.DESTINO || 'https://pausa.family').replace(/\/$/, '');
    // 308 conserva el método y el cuerpo (los envíos de «Compartir» de la app ya instalada).
    const status = request.method === 'GET' || request.method === 'HEAD' ? 301 : 308;
    return Response.redirect(`${destino}${url.pathname}${url.search}`, status);
  },
};
