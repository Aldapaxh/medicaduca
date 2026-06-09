export default function Privacidad() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <a href="/" className="text-sm text-green-600 hover:underline mb-4 inline-block">← Volver a MediCaduca</a>
      <h1 className="text-3xl font-bold mb-2">Política de Privacidad</h1>
      <p className="text-sm text-gray-500 mb-8">Última actualización: junio de 2026</p>

      <div className="prose prose-sm space-y-4 text-gray-700">

        <section>
          <h2 className="text-xl font-bold text-gray-900 mt-6 mb-2">1. Introducción</h2>
          <p>En MediCaduca respetamos tu privacidad. Esta política explica qué datos recopilamos, cómo los usamos y qué derechos tienes sobre ellos. MediCaduca está diseñado para ayudarte a controlar la caducidad de tus medicamentos de forma segura y privada.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mt-6 mb-2">2. Responsable del tratamiento</h2>
          <p>El responsable del tratamiento de tus datos es el equipo de MediCaduca. Puedes contactarnos en: <strong>contacto@medicaduca.app</strong></p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mt-6 mb-2">3. Datos que recopilamos</h2>
          <p>Para usar MediCaduca necesitamos los siguientes datos:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Datos de cuenta</strong>: nombre, dirección de email y contraseña cifrada.</li>
            <li><strong>Rol seleccionado</strong>: Hogar, Hospital, Farmacia o Médico.</li>
            <li><strong>Organización</strong>: si seleccionas un rol profesional, el nombre del centro.</li>
            <li><strong>Medicamentos</strong>: nombre, categoría, cantidad, fecha de caducidad y notas que tú introduces.</li>
            <li><strong>Preferencias</strong>: si quieres recibir avisos por email o no, idioma elegido.</li>
            <li><strong>Datos de suscripción Premium</strong> (si aplica): identificadores de cliente y suscripción de Stripe. NO almacenamos tus datos de tarjeta.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mt-6 mb-2">4. Cómo usamos tus datos</h2>
          <p>Usamos tus datos exclusivamente para:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Mostrarte tu botiquín y calcular las fechas de caducidad.</li>
            <li>Enviarte avisos por email cuando un medicamento esté a punto de caducar (solo si lo activas).</li>
            <li>Permitirte compartir tu botiquín con familiares o cuidadores que tú elijas.</li>
            <li>Gestionar tu suscripción Premium si decides hacerte Premium.</li>
            <li>Responder a tus consultas si nos contactas.</li>
          </ul>
          <p className="mt-2"><strong>NO vendemos tus datos. NO los compartimos con terceros con fines comerciales. NO te enviamos publicidad por email.</strong></p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mt-6 mb-2">5. Proveedores que utilizamos</h2>
          <p>Para ofrecer el servicio nos apoyamos en los siguientes proveedores, que cumplen con el RGPD:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Supabase</strong> (base de datos y autenticación)</li>
            <li><strong>Vercel</strong> (alojamiento de la aplicación web)</li>
            <li><strong>Stripe</strong> (procesamiento de pagos Premium)</li>
            <li><strong>Resend</strong> (envío de emails de aviso)</li>
            <li><strong>CIMA (AEMPS)</strong> (información pública de medicamentos en España, solo lectura)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mt-6 mb-2">6. Tus derechos</h2>
          <p>Tienes derecho a:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Acceder</strong> a tus datos en cualquier momento desde tu perfil.</li>
            <li><strong>Modificar</strong> tu nombre, contraseña, idioma y preferencias desde tu perfil.</li>
            <li><strong>Eliminar</strong> tu cuenta y todos tus datos desde tu perfil (zona peligrosa).</li>
            <li><strong>Exportar</strong> tus medicamentos en formato PDF (función Premium).</li>
            <li><strong>Oponerte</strong> al tratamiento o solicitar la portabilidad escribiendo a contacto@medicaduca.app.</li>
            <li><strong>Reclamar</strong> ante la Agencia Española de Protección de Datos (AEPD) si crees que tus derechos no se han respetado.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mt-6 mb-2">7. Cookies</h2>
          <p>MediCaduca no usa cookies de seguimiento ni de publicidad. Solo usamos cookies técnicas necesarias para mantener tu sesión iniciada.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mt-6 mb-2">8. Menores de edad</h2>
          <p>MediCaduca está pensada para adultos. No solicitamos ni recopilamos datos de menores de 14 años. Si eres padre o tutor y crees que tu hijo nos ha facilitado datos, contáctanos para eliminarlos.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mt-6 mb-2">9. Cambios en esta política</h2>
          <p>Si actualizamos esta política, te avisaremos en la app y/o por email. La fecha de la última actualización aparece al inicio de este documento.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mt-6 mb-2">10. Contacto</h2>
          <p>Para cualquier consulta sobre privacidad, escríbenos a: <strong>contacto@medicaduca.app</strong></p>
        </section>

      </div>
    </main>
  )
}