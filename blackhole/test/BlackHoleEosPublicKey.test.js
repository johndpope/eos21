const BigNumber = web3.BigNumber;
require('chai')
    .use(require('chai-bignumber')(BigNumber))
    .use(require('chai-as-promised'))
    .should();

const BlackHoleEosPublicKey = artifacts.require('BlackHoleEosPublicKey');
const ERC20Token = artifacts.require('ERC20Token');

contract('BlackHoleEosPublicKey', accounts => {
    const name = 'ERC20 test';
    const symbol = 'SNS';
    const decimals = 8;
    const tokens = 100;
    const minimumAmount = 0;

    const criticBlock = 0;
    const eosPublicKey = 'EOS7M38bvCoL7N3mBDbQyqePcK128G2b3so7XBa9hJn9uuKDN7we8';

    it ("can't teleport if blackHole is closed", async () => {
        const blackHole = await BlackHoleEosPublicKey.new(0x0, criticBlock, minimumAmount);
        await blackHole.close();
        await blackHole.teleportToKey(eosPublicKey).should.be.rejected;
    });

    it("teleport with invalid ERC20Contract", async () => {
        const blackHole = await BlackHoleEosPublicKey.new(0x0, criticBlock, minimumAmount);
        await blackHole.teleportToKey(eosPublicKey).should.be.rejected;
    });

    it('teleport', async () => {
        const erc20Token = await ERC20Token.new(name, symbol, tokens, decimals);
        const blackHole = await BlackHoleEosPublicKey.new(erc20Token.address, criticBlock, minimumAmount);

        let watcher = blackHole.TeleportToKey();

        await erc20Token.approve(blackHole.address, 10000000000);
        await blackHole.teleportToKey(eosPublicKey);
        const blackHoleBalance = await erc20Token.balanceOf(blackHole.address);
        blackHoleBalance.should.be.bignumber.equal(10000000000);
        const balance = await erc20Token.balanceOf(accounts[0]);
        balance.should.be.bignumber.equal(0);

        const events = await watcher.get();
        events.length.should.be.equal(1);
        events[0].args.eosPublicKey.should.be.equal(eosPublicKey);
        events[0].args.tokens.should.be.bignumber.equal(10000000000);
    });

    it('teleportToKey with less than minimum balance', async () => {
        const erc20Token = await ERC20Token.new(name, symbol, tokens, decimals);
        const blackHole = await BlackHoleEosPublicKey.new(erc20Token.address, criticBlock, 10000000001);

        await erc20Token.approve(blackHole.address, 10000000000);
        await blackHole.teleportToKey(eosPublicKey).should.be.rejected;
    });
});
