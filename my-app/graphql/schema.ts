export const typeDefs = `#graphql
  type User {
    id: ID!
    email: String!
    createdAt: String!
  }

  type Student {
    id: ID!
    name: String!
    email: String!
    age: Int!
    course: String!
    profileUrl: String
    createdAt: String!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type Query {
    students: [Student!]!
    student(id: ID!): Student
  }

  type Mutation {
    register(email: String!, password: String!): AuthPayload!
    login(email: String!, password: String!): AuthPayload!
    addStudent(name: String!, email: String!, age: Int!, course: String!, profileUrl: String): Student!
    updateStudent(id: ID!, name: String, email: String, age: Int, course: String, profileUrl: String): Student!
    deleteStudent(id: ID!): Student!
  }
`;
