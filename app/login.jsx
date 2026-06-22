if (perfilError) {
        setError('Error: ' + perfilError.message + ' (código: ' + (perfilError.code || 'sin código') + ')')
        setCargando(false)
        return
      }
      if (!perfil) {
        setError('Perfil no encontrado para el id: ' + data.user.id)
        setCargando(false)
        return
      }