import React from "react";
import { graphqlOperation } from "aws-amplify";
import { Connect } from "aws-amplify-react";
import { listMarkets } from "../graphql/queries";
import { onCreateMarket } from '../graphql/subscriptions';
import Error from "./Error";
import { Link } from "react-router-dom";
import { Loading, Card, Icon, Tag } from "element-react";



const MarketList = ({ searchResults }) => {
  const onNewMarket = (prevQuery, newData) => {
    let updatedQuery = { ...prevQuery };
    const updatedMarketList = [
      newData.onCreateMarket,
      ...prevQuery.listMarkets.items
    ]
    updatedQuery.listMarkets.items = updatedMarketList;
    return updatedQuery;
  }

  return(
    <Connect
      query={graphqlOperation(listMarkets)}
      subscription={graphqlOperation(onCreateMarket)}
      onSubscriptionMsg={onNewMarket}
    >
      {({ data, loading, errors }) => {
        if (errors.length > 0 ) return <Error errors={errors} />;
        if (loading || !data.listMarkets) return <Loading fullscreen={true}/>;
        const markets = searchResults.length > 0 ? searchResults: data.listMarkets.items;
        return(
          <>
          {searchResults.length > 0 ? (
            <h2 className="text-green">
              <Icon type="success" name="check" className="icon" />
              {searchResults.length} Results
            </h2>
          ) : <h2 className="header">
          <img src="https://img.icons8.com/cotton/30/000000/shop--v3.png" alt="Store Icon"/>
          Markets
          </h2>}
            {markets.map(market => (
              <div key={market.id} className="my-2">
                <Card
                  bodyStyle={{
                    padding: "0.7em",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between"
                  }}>
                    <div>
                      <span className="flex">
                        <Link className="link" to={`/markets/${market.id}`}>
                          {market.name}
                        </Link>
                        <img src="https://img.icons8.com/plasticine/20/000000/shopping-cart.png" alt="Shopping Card"/>
                      </span>
                      <div style={{ color: "var(--lightSquidInk)"}}>
                        {market.owner}
                      </div>
                      </div>
                      <div>
                      {market.tags && market.tags.map(tag => (
                        <Tag key={tag} type="danger" className="mx-1">
                          {tag}
                        </Tag>
                      ))}
                      </div>
                </Card>
              </div>
            ))}
          </>
        )
      }}
    </Connect>
  )
  
}

export default MarketList;