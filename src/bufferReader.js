export class BufferReader {
  constructor(buffer) {
    this.buffer = buffer;
    this.currentOffset = 0;
    this.read = () => {
      const length = this.readUInt8();
      const value = this.buffer
        .subarray(this.currentOffset, this.currentOffset + length)
        .toString("utf8");
      this.currentOffset += value.length;
      return value;
    };
    this.readUInt8 = () => {
      const value = this.buffer.readUInt8(this.currentOffset);
      this.currentOffset += 1;
      return value;
    };
    this.readUInt32LE = () => {
      const value = this.buffer.readUInt32LE(this.currentOffset);
      this.currentOffset += 4;
      return value;
    };
    this.readFloatLE = () => {
      const value = this.buffer.readFloatLE(this.currentOffset);
      this.currentOffset += 4;
      return value;
    };
  }
}
