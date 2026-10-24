#!groovy
import hudson.security.*
import jenkins.model.*

// Create or update the "student" user
def instance = Jenkins.getInstance()
def hudsonRealm = new HudsonPrivateSecurityRealm(false)
hudsonRealm.createAccount("student", "devopsible")
instance.setSecurityRealm(hudsonRealm)

// Grant the user full admin rights (you can tighten this later)
def strategy = new GlobalMatrixAuthorizationStrategy()
strategy.add(Jenkins.ADMINISTER, "student")
instance.setAuthorizationStrategy(strategy)

instance.save()
