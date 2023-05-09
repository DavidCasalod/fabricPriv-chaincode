/*
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { ChaincodeStub, ClientIdentity } = require('fabric-shim');
const { VDRFabricContract } = require('..');
const winston = require('winston');

const crypto = require('crypto');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

chai.should();
chai.use(chaiAsPromised);
chai.use(sinonChai);

class TestContext {

    constructor() {
        this.stub = sinon.createStubInstance(ChaincodeStub);
        this.clientIdentity = sinon.createStubInstance(ClientIdentity);
        this.logging = {
            getLogger: sinon.stub().returns(sinon.createStubInstance(winston.createLogger().constructor)),
            setLevel: sinon.stub(),
        };
    }

}

describe('VDRFabricContract', () => {

    let contract;
    let ctx;
    const mspid = 'one';
    const collectionName = `_implicit_org_${mspid}`;

    beforeEach(() => {
        contract = new VDRFabricContract();
        ctx = new TestContext();
        ctx.clientIdentity.getMSPID.returns(mspid);
        ctx.stub.getPrivateData.withArgs(collectionName, '001').resolves(Buffer.from('{"privateValue":"150"}'));
        const hashToVerify = crypto.createHash('sha256').update('{"privateValue":"150"}').digest('hex');
        ctx.stub.getPrivateDataHash.withArgs(collectionName, '001').resolves(Buffer.from(hashToVerify, 'hex'));
    });

    describe('#didExists', () => {

        it('should return true for a private asset that exists', async () => {
            await contract.didExists(ctx, '001').should.eventually.be.true;
        });

        it('should return false for a private asset that does not exist', async () => {
            await contract.didExists(ctx, '002').should.eventually.be.false;
        });

    });

    describe('#createdid', () => {

        it('should throw an error for a private asset that already exists', async () => {
            await contract.createdid(ctx, '001').should.be.rejectedWith('The asset did 001 already exists');
        });

        it('should throw an error if transient data is not provided when creating private asset', async () => {
            let transientMap = new Map();
            ctx.stub.getTransient.returns(transientMap);
            await contract.createdid(ctx, '002').should.be.rejectedWith('The privateValue key was not specified in transient data. Please try again.');
        });

        it('should throw an error if transient data key is not privateValue', async () => {
            let transientMap = new Map();
            transientMap.set('prVal', Buffer.from('125'));
            ctx.stub.getTransient.returns(transientMap);
            await contract.createdid(ctx, '002').should.be.rejectedWith('The privateValue key was not specified in transient data. Please try again.');
        });

        it('should create a private asset if transient data key is privateValue', async () => {
            let transientMap = new Map();
            transientMap.set('privateValue', Buffer.from('1500'));
            ctx.stub.getTransient.returns(transientMap);
            await contract.createdid(ctx, '002');
            ctx.stub.putPrivateData.should.have.been.calledOnceWithExactly(collectionName, '002', Buffer.from('{"privateValue":"1500"}'));
        });

    });

    describe('#readdid', () => {

        it('should throw an error for my private asset that does not exist', async () => {
            await contract.readdid(ctx, '003').should.be.rejectedWith('The asset did 003 does not exist');
        });

        it('should return my private asset', async () => {
            await contract.readdid(ctx, '001').should.eventually.deep.equal({ privateValue: '150' });
            ctx.stub.getPrivateData.should.have.been.calledWithExactly(collectionName, '001');
        });

    });

    describe('#updatedid', () => {

        it('should throw an error for my private asset that does not exist', async () => {
            await contract.updatedid(ctx, '003').should.be.rejectedWith('The asset did 003 does not exist');
        });

        it('should throw an error if transient data is not provided when updating private asset', async () => {
            let transientMap = new Map();
            ctx.stub.getTransient.returns(transientMap);
            await contract.updatedid(ctx, '001').should.be.rejectedWith('The privateValue key was not specified in transient data. Please try again.');
        });

        it('should update my private asset if transient data key is privateValue', async () => {
            let transientMap = new Map();
            transientMap.set('privateValue', Buffer.from('99'));
            ctx.stub.getTransient.returns(transientMap);
            await contract.updatedid(ctx, '001');
            ctx.stub.putPrivateData.should.have.been.calledOnceWithExactly(collectionName, '001', Buffer.from('{"privateValue":"99"}'));
        });

        it('should throw an error if transient data key is not privateValue', async () => {
            let transientMap = new Map();
            transientMap.set('prVal', Buffer.from('125'));
            ctx.stub.getTransient.returns(transientMap);
            await contract.updatedid(ctx, '001').should.be.rejectedWith('The privateValue key was not specified in transient data. Please try again.');
        });

    });

    describe('#deletedid', () => {

        it('should throw an error for my private asset that does not exist', async () => {
            await contract.deletedid(ctx, '003').should.be.rejectedWith('The asset did 003 does not exist');
        });

        it('should delete my private asset', async () => {
            await contract.deletedid(ctx, '001');
            ctx.stub.deletePrivateData.should.have.been.calledOnceWithExactly(collectionName, '001');
        });

    });

    describe('#verifydid', () => {

        it('should return success message if hash provided matches the hash of the private data', async () => {
            const objectToVerify = '{"privateValue":"125"}';
            const hashToVerify = crypto.createHash('sha256').update(objectToVerify).digest('hex');
            ctx.stub.getPrivateDataHash.withArgs(collectionName, '001').resolves(Buffer.from(hashToVerify, 'hex'));
            const result = await contract.verifydid(ctx, mspid, '001', '{"privateValue":"125"}');
            result.should.equal(true);
        });

        it('should throw an error if hash provided does not match the hash of the private data', async () => {
            ctx.stub.getPrivateDataHash.withArgs(collectionName, '001').resolves(Buffer.from('someHash'));
            const result = await contract.verifydid(ctx, mspid, '001', 'someObject');
            result.should.equal(false);
        });

        it('should throw an error when user tries to verify an asset that doesnt exist', async () => {
            ctx.stub.getPrivateDataHash.withArgs(collectionName, '001').resolves(Buffer.from(''));
            await contract.verifydid(ctx, mspid, '001', 'someObject').should.be.rejectedWith('No private data hash with the key: 001');
        });
    });
});
