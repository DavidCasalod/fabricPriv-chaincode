# AIOT Publisher Smart Contract



## Description
The Smart Contract is designed to publish data objects in an opaque manner for ARCADIAN-IoT Identities for a type of object e.g. Reputation object or Attribute Based Encryption Key object.

The published data objects can be consumed by any component in the ARCADIAN-IoT Framework, and also any external organisation configured on the Blockchain Network channel.

Essentially, the permissioned blockchain provides ARCADIAN-IoT with a distributed and fault-tolerant trusted database for use by multiple instances of the ARCADIAN-IoT Framework and also with external parties such as Attribute Based Encryption Key Providers, external services and auditors etc.

All published data objects are published to an off-chain database and only the hashes of the published data are stored on-chain so to provide immutable integrity of the published data.

## Badges
On some READMEs, you may see small images that convey metadata, such as whether or not all the tests are passing for the project. You can use Shields to add some to your README. Many services also have instructions for adding a badge.

## Installation
To instal the smart contract dependencies run the following command inside the root folder `aiot-publisher-smart-contract`:

```bash
npm install
```

Add the smart contract folder and smart contract name, version to the `PATH` environment variable:

```bash
export SC_NAME=aiot-publisher-sc
export SC_PATH=${PWD}
export SC_NAME=`jq '.name' package.json`
export SC_NAME=${SC_NAME//\"}
export SC_VERSION=`jq '.version' package.json`
export SC_VERSION=${SC_VERSION//\"}
```

confirm that the installation was successful and you are able to run  by running the following command:

```bash
peer version
```

To create a package using the peer lifecycle, run the following command:

```bash
peer lifecycle chaincode package ${SC_NAME}.tar.gz --path ${SC_PATH} --lang node --label ${SC_NAME}_${SC_VERSION}
```

## Usage

You need to first have a running Hyperledger Fabric network. You can use the [AIOT Publisher Fabric Network]() to run the smart contract.

install the smart contract on the peer nodes:

```bash
peer lifecycle chaincode install ${SC_NAME}.tar.gz
```

```bash
peer lifecycle chaincode approveformyorg -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --channelID mychannel --name ${SC_NAME} --version ${SC_VERSION} --package-id $CC_PACKAGE_ID --sequence 1 --tls --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem"
```

```bash
peer lifecycle chaincode approveformyorg -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --channelID mychannel --name ${SC_NAME} --version ${SC_VERSION} --package-id $CC_PACKAGE_ID --sequence 1 --tls --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem"
```
```bash	
peer lifecycle chaincode checkcommitreadiness --channelID mychannel --name ${SC_NAME} --version ${SC_VERSION} --sequence 1 --tls --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" --output json
```

```bash	
peer lifecycle chaincode commit -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --channelID mychannel --name ${SC_NAME} --version ${SC_VERSION} --sequence 1 --tls --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" --peerAddresses localhost:7051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" --peerAddresses localhost:9051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt"
```
Test the smart contract by running the following commands:

```bash
export ASSET_PROPERTIES=$(echo -n "33" | base64 | tr -d \\n)

#write asset
peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" -C mychannel -n ${SC_NAME} --peerAddresses localhost:7051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" --peerAddresses localhost:9051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt" -c '{"function":"createReputation","Args":["123"]}' --transient "{\"didDoc\":\"$ASSET_PROPERTIES\"}"
```

```bash
#read asset
peer chaincode query -C mychannel -n ${SC_NAME} -c '{"function":"readReputation","Args":["123"]}'
```
## Private data with collections

For testing with the new version using collections you need to use the collection file:

Inside the `fabric-samples/test-network` folder run the following command to clean up the network:

```bash	
./network.sh down
```

Start up the network with the next command:

```bash
./network.sh up createChannel -ca -s couchdb
```

Deploy the private data smart contract:

```bash
./network.sh deployCC -ccn ${SC_NAME} -ccp ${SC_PATH} -ccl javascript -ccv ${SC_VERSION} -ccep "OR('Org1MSP.peer','Org2MSP.peer')" -cccg ${SC_PATH}/collections.json
```

For testing the private data smart contract you need to use the following commands:

Export the environment variables for peer inside the `test-network` folder:

```bash
export PATH=${PWD}/../bin:$PATH
export FABRIC_CFG_PATH=$PWD/../config/
```

Export the following enviorenment variables:

```bash
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=localhost:7051
```

Create the asset:

```bash
export ASSET_COLLECTION=abeKey
export ASSET_PROPERTIES=$(echo -n "{\"a\":\"123\",\"b\":\"321\",\"c\":\"xyz\"}" | base64 | tr -d \\n)

#write asset
peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" -C mychannel -n ${SC_NAME} --peerAddresses localhost:7051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" --peerAddresses localhost:9051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt" -c '{"function":"createReputation","Args":["123","abeKey"]}' --transient "{\"didDoc\":\"$ASSET_PROPERTIES\"}"
```


Read the asset:

```bash
#read asset
peer chaincode query -C mychannel -n ${SC_NAME} -c '{"function":"readReputation","Args":["123","abeKey"]}'
```

## Support
Tell people where they can go to for help. It can be any combination of an issue tracker, a chat room, an email address, etc.

## Roadmap
If you have ideas for releases in the future, it is a good idea to list them in the README.

## Contributing
State if you are open to contributions and what your requirements are for accepting them.

For people who want to make changes to your project, it's helpful to have some documentation on how to get started. Perhaps there is a script that they should run or some environment variables that they need to set. Make these steps explicit. These instructions could also be useful to your future self.

You can also document commands to lint the code or run tests. These steps help to ensure high code quality and reduce the likelihood that the changes inadvertently break something. Having instructions for running tests is especially helpful if it requires external setup, such as starting a Selenium server for testing in a browser.

## License
For open source projects, say how it is licensed.

