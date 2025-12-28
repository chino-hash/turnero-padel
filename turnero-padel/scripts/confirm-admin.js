require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

// Configuración de Supabase con service role key
const supabaseUrl = 'https://nfxvzoaxqcwpwfpgrqxq.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseServiceKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY no está configurado')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function confirmAdminUser() {
  try {
    console.log('Buscando usuario admin@padelclub.com...')
    
    // Buscar el usuario por email
    const { data: users, error: listError } = await supabase.auth.admin.listUsers()
    
    if (listError) {
      console.error('Error al listar usuarios:', listError)
      return
    }
    
    const adminUser = users.users.find(user => user.email === 'admin@padelclub.com')
    
    if (!adminUser) {
      console.error('Usuario admin@padelclub.com no encontrado')
      return
    }
    
    console.log('Usuario encontrado:', adminUser.id)
    
    // Confirmar el email del usuario
    const { data, error } = await supabase.auth.admin.updateUserById(
      adminUser.id,
      { 
        email_confirm: true,
        email_confirmed_at: new Date().toISOString()
      }
    )
    
    if (error) {
      console.error('Error al confirmar usuario:', error)
      return
    }
    
    console.log('✅ Usuario confirmado exitosamente')
    
    // Crear perfil de administrador
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: adminUser.id,
        email: adminUser.email,
        role: 'admin',
        full_name: 'Administrador',
        updated_at: new Date().toISOString()
      })
    
    if (profileError) {
      console.error('Error al crear perfil:', profileError)
    } else {
      console.log('✅ Perfil de administrador creado')
    }
    
  } catch (error) {
    console.error('Error:', error)
  }
}

confirmAdminUser()
