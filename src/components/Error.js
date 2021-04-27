import React from "react";




function Error({ errors }){
  return(
  < pre className="error">
    {errors.map((err, i) => ( 
    <div key={i}>{err.message}</div>
    ))}
  </pre>
  );
}

export default Error;