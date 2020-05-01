import company from "src/company.json";

main();
function main() {
  console.log(`This is ${company.name}`);
  company.members.forEach(member => {
    console.log(`name: ${member.name}, age: ${member.age}`);
  });
}
