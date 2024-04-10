#!/bin/bash

# Start web server
bundle exec rails s -d -p 3000 -b '0.0.0.0'

# Run migrations
bundle exec rails db:migrate

# Ruby script to create admin (to file)
# NOTE REDIRECT_URI env var is injected
cat << EOF > create_admin_user.rb
unless User.exists?(email: "admin@hotosm.org")
  pass_crypt, pass_salt = PasswordHash.create('Password1234')
  new_user = User.create!(
      display_name: "HOTOSM",
      email: "admin@hotosm.org",
      pass_crypt: pass_crypt,
      pass_salt: pass_salt,
      email_valid: true,
      data_public: true,
      terms_seen: true,
      terms_agreed: Time.now,
      tou_agreed: Time.now,
  )
  new_user.confirm!
  new_user.roles.create(role: "administrator", granter_id: new_user.id)
  new_user.roles.create(role: "moderator", granter_id: new_user.id)
end

unless Oauth2Application.exists?(name: 'OSM Dev')
  new_user = User.find_by(email: "admin@hotosm.org")
  new_app = Oauth2Application.create!(
      owner: new_user,
      name: 'OSM Dev',
      redirect_uri: "#{ENV['REDIRECT_URI']}",
      scopes: ['read_prefs', 'write_api'],
      confidential: false,
  )
  puts ""
  puts "Generated OSM Oauth Client / Secret:"
  puts ""
  puts "UID: #{new_app.uid}"
  puts "Secret: #{new_app.secret}"
  puts ""
end
EOF

# Run script in Rails console
bundle exec rails runner create_admin_user.rb

# Stop web server gracefully
kill -TERM $(cat /tmp/pids/server.pid)

# Set exec to replace shell with the command passed as arguments
exec "$@"
