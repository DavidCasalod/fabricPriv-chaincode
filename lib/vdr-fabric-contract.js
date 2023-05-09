/*
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Contract } = require('fabric-contract-api');
const crypto = require('crypto');
const stringify = require('json-stringify-deterministic')

/**
 * Clean the string removing escape sequences
 * @param {String} string to clean
 * @returns {String} string cleaned
 */
async function cleanString(string) {
    string.replace("\\n", "");
    string.replace("\\r", "");
    string.replace("\\t", "");
    string.replace("\\", "");
    return string;
}



class VDRFabricContract extends Contract {

    async didExists(ctx, didId) {
        const collectionName = "didDocCollection"
        const data = await ctx.stub.getPrivateDataHash(collectionName, didId);
        return (!!data && data.length > 0);
    }

    async createdid(ctx, didId) {
        const exists = await this.didExists(ctx, didId);
        if (exists) {
            throw new Error(`The asset did ${didId} already exists`);
        }

        const privateAsset = {};

        const transientData = ctx.stub.getTransient();
        if (transientData.size === 0 || !transientData.has('didDoc')) {
            throw new Error('The didDoc key was not specified in transient data. Please try again.');
        }

        //obtain the dataOnject from transient data
        const didDocString = transientData.get('didDoc').toString("utf8");

        //clean the string
        const didDocStringClean = await cleanString(didDocString);

        //parse the string to JSON
        const didDocJSON = JSON.parse(didDocStringClean);

        //add the didDoc to the private asset
        privateAsset.didDoc = didDocJSON;
        //TODO: add the hash of the didId after testing it
        const collectionName = "didDocCollection";
        await ctx.stub.putPrivateData(collectionName, didId, Buffer.from(stringify(privateAsset)));
    }

    async readdid(ctx, didId) {
        const exists = await this.didExists(ctx, didId);
        if (!exists) {
            throw new Error(`The asset did ${didId} does not exist`);
        }
        let privateDataString;
        const collectionName = "didDocCollection";
        const privateData = await ctx.stub.getPrivateData(collectionName, didId);
        privateDataString = JSON.parse(privateData.toString());
        return privateDataString;
    }

    async updatedid(ctx, didId) {
        const exists = await this.didExists(ctx, didId);
        if (!exists) {
            throw new Error(`The asset did ${didId} does not exist`);
        }
        const privateAsset = {};

        const transientData = ctx.stub.getTransient();
        if (transientData.size === 0 || !transientData.has('didDoc')) {
            throw new Error('The didDoc key was not specified in transient data. Please try again.');
        }
        privateAsset.didDoc = transientData.get('didDoc').toString();

        const collectionName = "didDocCollection";
        await ctx.stub.putPrivateData(collectionName, didId, Buffer.from(stringify(privateAsset)));
    }

    async deletedid(ctx, didId) {
        const exists = await this.didExists(ctx, didId);
        if (!exists) {
            throw new Error(`The asset did ${didId} does not exist`);
        }
        const collectionName = "didDocCollection";
        await ctx.stub.deletePrivateData(collectionName, didId);
    }

    async verifydid(ctx, didId, objectToVerify) {

        // Convert provided object into a hash
        const hashToVerify = crypto.createHash('sha256').update(objectToVerify).digest('hex');
        const pdHashBytes = await ctx.stub.getPrivateDataHash("didDocCollection", didId);
        if (pdHashBytes.length === 0) {
            throw new Error('No private data hash with the key: ' + didId);
        }

        const actualHash = Buffer.from(pdHashBytes).toString('hex');

        // Compare the hash calculated (from object provided) and the hash stored on public ledger
        if (hashToVerify === actualHash) {
            return true;
        } else {
            return false;
        }
    }


}

module.exports = VDRFabricContract;
