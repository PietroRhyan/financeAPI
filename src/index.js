const express = require('express')
const { v4: uuidv4 } = require('uuid')

const app = express()

app.use(express.json())

const customers = []

// Middleware
function verifyIfExistsAccountByCPF(req, res, next) {
  const { cpf } = req.headers
  
  const customer = customers.find(customer => customer.cpf === cpf)

  if(!customer) {
    return res.status(400).send({error: 'Customer not found!'})
  }

  req.customer = customer

  return next()
}

// Criar um usuário
app.post('/account', (req, res) => {
  const { name, cpf } = req.body

  const customersAlreadyExists = customers.some((customer) => customer.cpf === cpf)

  if (customersAlreadyExists) {
    return res.status(400).send({error: 'Customer Already Exists!'})
  }
  
  customers.push({
    cpf,
    name,
    id: uuidv4(),
    statement: [],
  })

  console.log(customers)
  return res.status(201).send()
})

// Buscar o extrato bancário do cliente
app.get('/statement', verifyIfExistsAccountByCPF, (req, res) => {
  const { customer } = req

  return res.json(customer.statement)
})

app.listen(3333)