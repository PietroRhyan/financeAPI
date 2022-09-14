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

// Função de operação de saldo
function getBalance(statement) {
  const balance = statement.reduce((acc, operation) => {
    if(operation.type === 'credit') {
      return acc + operation.amount
    } else {
      return acc - operation.amount
    }
  }, 0)

  return balance
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

  return res.status(201).send()
})

// Buscar o extrato bancário do cliente
app.get('/statement', verifyIfExistsAccountByCPF, (req, res) => {
  const { customer } = req

  return res.json(customer.statement)
})

// Realizar depósito
app.post('/deposit', verifyIfExistsAccountByCPF, (req, res) => {
  const { description, amount } = req.body
  
  const { customer } = req
  
  const statementOperation = {
    description,
    amount,
    created_at: new Date(),
    type: 'credit',
  }

  customer.statement.push(statementOperation)

  return res.status(201).send()
})

// Realizar o saque
app.post('/withdraw', verifyIfExistsAccountByCPF, (req, res) => {
  const { amount } = req.body

  const { customer } = req

  const balance = getBalance(customer.statement)

  if(balance < amount) {
    return res.status(400).send({error: 'Insufficient funds!'})
  }

  const statementOperation = {
    amount,
    created_at: new Date(),
    type: 'debit',
  }

  customer.statement.push(statementOperation)

  return res.status(201).send()
})

// Pegar o extrato do cliente em determinadado dia
app.get('/statement/date', verifyIfExistsAccountByCPF, (req, res) => {
  const { customer } = req
  const { date } = req.query

  const dateFormat = new Date(date + " 00:00")

  const statement = customer.statement.filter((statement) => statement.created_at.toDateString() === new Date(dateFormat).toDateString())

  return res.json(statement)
})

// Atualizar informações (nome) do usuário
app.put('/account', verifyIfExistsAccountByCPF, (req, res) => {
  const { name } = req.body
  const { customer } = req

  customer.name = name

  return res.status(201).send()
})

// Pegar as informações do usuário
app.get('/account', verifyIfExistsAccountByCPF, (req, res) => {
  const { customer } = req

  return res.json(customer)
})

// Deletar um usuário
app.delete('/account', verifyIfExistsAccountByCPF, (req, res) => {
  const { customer } = req

  customers.splice(customer, 1)

  return res.status(200).json(customers)
})

// Pegar o saldo do usuário
app.get('/balance', verifyIfExistsAccountByCPF, (req, res) => {
  const { customer } = req

  const balance = getBalance(customer.statement)

  return res.json(balance)
})

app.listen(3333)