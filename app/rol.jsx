'use client'

const roles = [
  { id:'hogar', icono:'🏠', nombre:'Hogar', desc:'Botiquín familiar', color:'bg-green-50 border-green-200' },
  { id:'hospital', icono:'🏥', nombre:'Hospital', desc:'Unidades y plantas', color:'bg-blue-50 border-blue-200' },
  { id:'farmacia', icono:'🏪', nombre:'Farmacia', desc:'Stock y referencias', color:'bg-amber-50 border-amber-200' },
  { id:'medico', icono:'👨‍⚕️', nombre:'Médico', desc:'Pacientes y prescripciones', color:'bg-purple-50 border-purple-200' },
]

export default function Rol({ onSeleccionar }) {
  return (
    <div className="py-8 max-w-md mx-auto">
      <h1 className="font-bold text-2xl mb-1">Medi<span className="text-green-600">Caduca</span></h1>
      <p className="text-gray-500 text-sm mb-8">Gratis para siempre · Sin registro obligatorio</p>
      <div className="font-medium text-sm mb-4">¿Para qué lo usas?</div>
      <div className="grid grid-cols-2 gap-3 mb-8">
        {roles.map(r => (
          <button
            key={r.id}
            onClick={() => onSeleccionar(r.id)}
            className={`${r.color} border rounded-xl p-4 text-left hover:scale-105 transition-transform`}
          >
            <div className="text-2xl mb-2">{r.icono}</div>
            <div className="font-medium text-sm">{r.nombre}</div>
            <div className="text-xs text-gray-500 mt-1">{r.desc}</div>
            <div className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full inline-block mt-2 font-medium">Gratis</div>
          </button>
        ))}
      </div>
    </div>
  )
}