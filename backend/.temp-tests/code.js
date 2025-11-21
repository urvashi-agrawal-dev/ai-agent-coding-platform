
// Function to compute GCD using Euclidean algorithm
function gcd(a, b) {
    a = Math.abs(a);
    b = Math.abs(b);
    while (b !== 0) {
        let temp = b;
        b = a % b;
        a = temp;
    }
    return a;
}

// Function to compute LCM
function lcm(a, b) {
    if (typeof a !== 'number' || typeof b !== 'number' || isNaN(a) || isNaN(b)) {
        throw new Error("Both inputs must be valid numbers.");
    }
    if (a === 0 || b === 0) return 0;
    return Math.abs(a * b) / gcd(a, b);
}

// Example usage:
try {
    let num1 = 12;
    let num2 = 18;
    console.log(`LCM of ${num1} and ${num2} is: ${lcm(num1, num2)}`);

    num1 = -4;
    num2 = 6;
    console.log(`LCM of ${num1} and ${num2} is: ${lcm(num1, num2)}`);

    num1 = 0;
    num2 = 5;
    console.log(`LCM of ${num1} and ${num2} is: ${lcm(num1, num2)}`);
} catch (err) {
    console.error("Error:", err.message);
}

