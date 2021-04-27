import React from "react";
import { S3Image } from 'aws-amplify-react'
import { API, graphqlOperation } from 'aws-amplify';
import { Notification, Popover, Button, Dialog, Card, Form, Input, Radio } from "element-react";
import { updateProduct, deleteProduct } from '../graphql/mutations';
import {converCentsToDollar, converDollarsToCents} from '../utils/index'
import { UserContext } from '../App'
import PayButton from "./PayButton"

class Product extends React.Component {
  state = {
    description: "",
    price: "",
    shipped: false,
    updatedProductDialog: false,
    deleteProductDiaglog: false
  };

  handleUpdateProduct = async productId => {
    try {
      this.setState({ updatedProductDialog: false })
      const { description, price, shipped } = this.state
      const input = {
        id: productId,
        description,
        price: converDollarsToCents(price),
        shipped
      }
      const result = await API.graphql(graphqlOperation(updateProduct, { input }))
      console.log(result)
      Notification({
        title: "Success",
        message: "Product updated",
        type: "success",
        duration: 2000
      });
      setTimeout(() => window.location.reload(), 1000)
    }catch(err){
      console.error(`Failed to update product with id ${productId}`, err)
  } 
}

  handleDeleteProduct = async productId => {
    try{
      this.setState({ deleteProductDiaglog: false})
      const input ={
        id: productId
      }
      await API.graphql(graphqlOperation(deleteProduct, { input }))
      Notification({
        title: "Success",
        message: "Product deleted",
        type: "success",
        duration: 2000
      });
      setTimeout(() => window.location.reload(), 1000)
    } catch(err){
      console.error(`Failed to delete product with id ${productId}`, err)
    }
  }


  render(){
    const { updatedProductDialog, description, price, shipped, deleteProductDiaglog } = this.state;
    const { product } = this.props;
    return (
      <UserContext.Consumer>
        {({ user }) => {
          const isProductOwner = user && user.attributes.sub === product.owner;

          return(
            <div className="card-container">
            <Card bodyStyle={{ padding: 0, minWidth: '200px'}}>
              <S3Image 
                imgKey={product.file.key}
                theme={{
                  photoImg: { maxWidth: '100%', maxHeight: '100%'}
                }}/>
              <div className="card-body">
                <h3 className="m-0">{product.description}</h3>
                <div className="items-center">
                    {product.shipped ? "Shipped" : "Emailed"}
                </div>  
                <div className="text-right">
                  <span className="mx-1">
                    ${converCentsToDollar(product.price)}
                  </span>
                  {!isProductOwner && (
                    <PayButton product={product} user={user}/>
                  )}
                </div>
              </div>  
            </Card>

            {/* Update and Delete */}
            <div className="text-center">
              {isProductOwner && (
                <>
                <Button 
                type="warning"
                icon="edit"
                className="m-1"
                onClick={() => this.setState({ 
                  updatedProductDialog: true,
                  description: product.description,
                  shipped: product.shipped,
                  price: converCentsToDollar(product.price)
                })}
                />
                <Popover
                  placement="top"
                  width="160"
                  trigger="click"
                  visible={deleteProductDiaglog}
                  content={
                    <>
                    <p>Do you want to delete?</p>
                    <div className="text-right"> 
                    <Button
                      size="mini"
                      type="text"
                      className="m-1"
                      onClick={() => this.setState({ deleteProductDiaglog: false})}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="primary"
                      size="mini"
                      className="m-1"
                      onClick={() => this.handleDeleteProduct(product.id)}
                    >
                      Confirm
                    </Button>
                    </div>
                    </>
                  }
                >
                  <Button 
                  type="danger"
                  icon="delete"
                  className="m-1"
                  onClick={() => this.setState({ deleteProductDiaglog: true})}
                  />
                </Popover> 
                </>
              )}
            </div>

            {/* Update Product Dialog */}
            <Dialog
              title="Update product"
              size="large"
              customClass="dialog"
              visible={updatedProductDialog}
              onCancel={() => this.setState({ updatedProductDialog: false })}
            >

              <Dialog.Body>
                <Form labelPosition="top">
                <Form.Item label="Add Product Description">
                    <Input
                      icon="information"
                      placeholder="Product Description"
                      trim={true}
                      value={description}
                      onChange={description => this.setState({ description })}
                      />
                  </Form.Item>

                  <Form.Item label="Update Price">
                    <Input
                      type="number"
                      placeholder="Price ($USD)"
                      value={price}
                      onChange={price => this.setState({ price })}
                      />
                  </Form.Item>

                  <Form.Item label="Update shipping">
                    <div className="text-center">
                      <Radio
                      value="true"
                      checked={shipped === true}
                      onChange={() => this.setState({ shipped: true })}>
                        Shipped
                      </Radio>
                      <Radio
                        value="false"
                        checked={shipped === false}
                        onChange={() => this.setState({ shipped: false })}
                      >
                        Emailed
                      </Radio>
                    </div>
                  </Form.Item>
                </Form>
              </Dialog.Body>

              <Dialog.Footer>
                <Button
                onClick={() => this.setState({ updatedProductDialog: false })}>
                  Cancel
                </Button>
                <Button
                type="primary"
                onClick={() => this.handleUpdateProduct(product.id)}>
                  Confirm
                </Button>
              </Dialog.Footer>
            </Dialog>
          </div>
              )
            }}
      </UserContext.Consumer>
    )
  }
}

export default Product;