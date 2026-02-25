// Zero-Knowledge Proof of Backing Circuit
// ---------------------------------------
// Private Inputs: reserves (an array of reserve asset balances)
// Public Input: circulating_supply (the total liabilities of the protocol)
// Logic: sum(reserves) >= circulating_supply

fn main(reserves: [u64; 5], circulating_supply: pub u64) {
    let mut total_reserves: u64 = 0;
    
    // Sum up the reserve balances
    for i in 0..5 {
        total_reserves += reserves[i];
    }
    
    // Assert that the Protocol is fully backed or over-collateralized
    assert(total_reserves >= circulating_supply);
}

#[test]
fn test_fully_backed() {
    let reserves = [1000, 2000, 3000, 0, 0]; // Sum = 6000
    let circulating_supply = 5000;
    main(reserves, circulating_supply);
}

#[test(should_fail)]
fn test_under_collateralized() {
    let reserves = [1000, 2000, 0, 0, 0]; // Sum = 3000
    let circulating_supply = 5000;
    main(reserves, circulating_supply);
}
