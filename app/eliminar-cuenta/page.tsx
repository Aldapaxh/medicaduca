export default function EliminarCuenta() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <a href="/" className="text-sm text-green-600 hover:underline mb-4 inline-block">← Volver a MediCaduca</a>
      <h1 className="text-3xl font-bold mb-2">Eliminar tu cuenta de MediCaduca</h1>
      <p className="text-sm text-gray-500 mb-8">Cómo borrar tu cuenta y todos tus datos</p>

      <div className="space-y-6 text-gray-700">

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-2">¿Cómo eliminar tu cuenta?</h2>
          <p>Puedes eliminar tu cuenta de MediCaduca y todos tus datos en cualquier momento, directamente desde la aplicación, en 3 pasos:</p>
          <ol className="list-decimal pl-6 mt-3 space-y-2">
            <li>Inicia sesión en MediCaduca con tu email y contraseña.</li>
            <li>Pulsa el círculo con tus iniciales arriba a la derecha para abrir tu <strong>Perfil</strong>.</li>
            <li>Baja hasta la sección <strong>Zona peligrosa</strong> y pulsa <strong>Eliminar mi cuenta</strong>. Escribe <strong>ELIMINAR</strong> para confirmar y pulsa <strong>Confirmar eliminación</strong>.</li>
          </ol>
          <p className="mt-3">La eliminación es <strong>inmediata e irreversible</strong>.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-2">¿Qué datos se eliminan?</h2>
          <p>Cuando eliminas tu cuenta, borramos para siempre:</p>
          <ul className="list-disc pl-6 mt-3 space-y-1">
            <li>Tu nombre, email y contraseña.</li>
            <li>Tu rol y organización (si aplica).</li>
            <li>Todos tus medicamentos y fechas de caducidad.</li>
            <li>Todas tus invitaciones y miembros compartidos.</li>
            <li>Tus preferencias de notificaciones por email.</li>
            <li>Tu cuenta de autenticación.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-2">¿Qué datos se conservan?</h2>
          <p>Por motivos legales y contables, conservamos durante un máximo de 5 años:</p>
          <ul className="list-disc pl-6 mt-3 space-y-1">
            <li>Registros de pagos (si has sido usuario Premium), gestionados por Stripe según la legislación fiscal vigente.</li>
          </ul>
          <p className="mt-3">El resto de datos se elimina inmediatamente y de forma permanente.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-2">¿No puedes acceder a tu cuenta?</h2>
          <p>Si no puedes iniciar sesión por algún motivo (contraseña perdida, email inaccesible, etc.), puedes solicitar la eliminación manual escribiéndonos a:</p>
          <p className="mt-3"><strong>contacto@medicaduca.app</strong></p>
          <p className="mt-2">Procesaremos tu solicitud en un máximo de 30 días naturales, según establece el RGPD.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-2">¿Tienes dudas?</h2>
          <p>Si tienes cualquier pregunta sobre la eliminación de tu cuenta o sobre tus datos, contacta con nosotros en <strong>contacto@medicaduca.app</strong>.</p>
        </section>

      </div>
    </main>
  )
}